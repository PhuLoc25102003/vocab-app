'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Notification } from '@vocab/shared';
import {
  Bell,
  BookOpenCheck,
  CalendarClock,
  ClipboardList,
  type LucideIcon,
  Snowflake,
  Sparkles,
} from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isBadgeCode } from '@/components/common/badge-icon';
import { Button } from '@/components/ui/button';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationKeys,
} from '../api';

const ICONS: Record<Notification['type'], LucideIcon> = {
  ASSIGNMENT_NEW: ClipboardList,
  ASSIGNMENT_DUE: CalendarClock,
  REVIEW_DUE: BookOpenCheck,
  BADGE_EARNED: Sparkles,
  STREAK_FROZEN: Snowflake,
};

/** Tự làm mới số chưa đọc mỗi phút và khi quay lại tab. */
const POLL_MS = 60_000;

function useNotificationText() {
  const { t, i18n } = useTranslation('common');
  const { t: tStudy } = useTranslation('study');
  const dateTime = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const relative = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' });
  const text = ({ type, data }: Notification): string => {
    const value = (key: string) => {
      const raw = data[key];
      return raw === null || raw === undefined ? '' : String(raw);
    };
    const dueAt = value('dueAt') ? dateTime.format(new Date(value('dueAt'))) : '';
    switch (type) {
      case 'ASSIGNMENT_NEW':
        return t(
          dueAt ? 'notifications.types.ASSIGNMENT_NEW_due' : 'notifications.types.ASSIGNMENT_NEW',
          {
            className: value('className'),
            setTitle: value('setTitle'),
            dueAt,
          },
        );
      case 'ASSIGNMENT_DUE':
        return t('notifications.types.ASSIGNMENT_DUE', { setTitle: value('setTitle'), dueAt });
      case 'REVIEW_DUE': {
        const count = Number(value('count')) || 0;
        const streakDays = Number(value('streakDays')) || 0;
        if (streakDays > 0) {
          return t(
            count > 0
              ? 'notifications.types.REVIEW_DUE_streak'
              : 'notifications.types.REVIEW_DUE_streakOnly',
            { streakDays, count },
          );
        }
        return t('notifications.types.REVIEW_DUE', { count });
      }
      case 'BADGE_EARNED': {
        const code = value('code');
        const badge = isBadgeCode(code) ? tStudy(`badges.items.${code}.name`) : code;
        return t('notifications.types.BADGE_EARNED', { badge });
      }
      case 'STREAK_FROZEN':
        return t('notifications.types.STREAK_FROZEN', { day: value('day') });
    }
  };
  const ago = (iso: string) => {
    const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
    if (Math.abs(minutes) < 60) return relative.format(minutes, 'minute');
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return relative.format(hours, 'hour');
    return relative.format(Math.round(hours / 24), 'day');
  };
  return { text, ago };
}

/** Nút chuông trên header: số chưa đọc và danh sách thông báo mới nhất. */
export function NotificationBell() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { text, ago } = useNotificationText();
  const unread = useQuery({
    queryKey: notificationKeys.unread,
    queryFn: getUnreadCount,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
  });
  const list = useQuery({
    queryKey: notificationKeys.list,
    queryFn: listNotifications,
    enabled: open,
    staleTime: 0,
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  const readOne = useMutation({ mutationFn: markNotificationRead, onSettled: refresh });
  const readAll = useMutation({ mutationFn: markAllNotificationsRead, onSettled: refresh });

  const count = unread.data ?? 0;
  const items = list.data?.data ?? [];

  return (
    <Menu open={open} onOpenChange={setOpen}>
      <MenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative shrink-0"
          aria-label={count > 0 ? t('notifications.open', { count }) : t('notifications.openNone')}
        >
          <Bell aria-hidden className="size-5" />
          {count > 0 ? (
            <span
              aria-hidden
              className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-tiny font-semibold leading-none text-primary-fg tabular-nums"
            >
              {count > 9 ? '9+' : count}
            </span>
          ) : null}
        </Button>
      </MenuTrigger>
      <MenuContent className="w-[min(24rem,calc(100vw-2rem))]">
        <div className="flex items-center justify-between gap-2 px-3 pb-1 pt-2">
          <span className="text-h3">{t('notifications.title')}</span>
        </div>
        {count > 0 ? (
          <MenuItem
            onSelect={(event) => {
              event.preventDefault();
              readAll.mutate();
            }}
            className="text-small font-medium text-primary"
          >
            {t('notifications.markAll')}
          </MenuItem>
        ) : null}
        <MenuSeparator />
        {list.isPending ? (
          <div
            role="status"
            aria-label={t('notifications.loading')}
            className="flex flex-col gap-2 p-2"
          >
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : list.isError ? (
          <div className="flex flex-col items-start gap-2 p-3">
            <p className="text-small text-text-muted">{t('notifications.failed')}</p>
            <MenuItem
              onSelect={(event) => {
                event.preventDefault();
                void list.refetch();
              }}
              className="text-small font-medium text-primary"
            >
              {t('notifications.retry')}
            </MenuItem>
          </div>
        ) : items.length === 0 ? (
          <p className="px-3 py-6 text-center text-small text-text-muted">
            {t('notifications.empty')}
          </p>
        ) : (
          items.map((notification) => {
            const Icon = ICONS[notification.type];
            const isUnread = notification.readAt === null;
            return (
              <MenuItem
                key={notification.id}
                onSelect={() => {
                  if (isUnread) readOne.mutate(notification.id);
                  if (notification.href) router.push(notification.href as Route);
                }}
                className="items-start py-2.5"
              >
                <span
                  aria-hidden
                  className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary"
                >
                  <Icon className="size-4" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={cn('break-words text-small', isUnread && 'font-semibold')}>
                    {text(notification)}
                  </span>
                  <span className="text-tiny text-text-muted">{ago(notification.createdAt)}</span>
                </span>
                {isUnread ? (
                  <span className="mt-2 size-2 shrink-0 rounded-full bg-primary">
                    <span className="sr-only">{t('notifications.unread')}</span>
                  </span>
                ) : null}
              </MenuItem>
            );
          })
        )}
      </MenuContent>
    </Menu>
  );
}
