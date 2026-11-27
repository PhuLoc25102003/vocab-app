'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationPrefs } from '@vocab/shared';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { getNotificationPrefs, PREFS_KEY, sendTestPush, updateNotificationPrefs } from '../api';
import { usePush, type PushStatus } from '../push';

const HINTS: Partial<
  Record<PushStatus, 'push.unsupported' | 'push.iosInstall' | 'push.serverOff' | 'push.denied'>
> = {
  unsupported: 'push.unsupported',
  'ios-install': 'push.iosInstall',
  'server-off': 'push.serverOff',
  denied: 'push.denied',
};

const ROWS = [
  { label: 'push.typeReview', push: 'reviewPush', email: 'reviewEmail' },
  { label: 'push.typeAssignment', push: 'assignmentPush', email: 'assignmentEmail' },
] as const satisfies readonly {
  label: string;
  push: keyof NotificationPrefs;
  email: keyof NotificationPrefs;
}[];

/** Bật tắt từng loại nhắc theo kênh. Kênh đẩy chỉ có tác dụng khi thiết bị đã bật thông báo đẩy. */
function PrefsGrid() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const prefs = useQuery({ queryKey: PREFS_KEY, queryFn: getNotificationPrefs });
  const save = useMutation({
    mutationFn: updateNotificationPrefs,
    onMutate: async (changes) => {
      await queryClient.cancelQueries({ queryKey: PREFS_KEY });
      const previous = queryClient.getQueryData<NotificationPrefs>(PREFS_KEY);
      if (previous) queryClient.setQueryData(PREFS_KEY, { ...previous, ...changes });
      return { previous };
    },
    onError: (_error, _changes, context) => {
      if (context?.previous) queryClient.setQueryData(PREFS_KEY, context.previous);
      toast.error(t('push.prefsFailed'));
    },
    onSuccess: (next) => {
      queryClient.setQueryData(PREFS_KEY, next);
      toast.success(t('push.prefsSaved'));
    },
  });

  if (prefs.isPending) return <Skeleton className="h-24 w-full" />;
  if (prefs.isError) return null;

  return (
    <div role="group" aria-labelledby="prefs-grid-label" className="flex flex-col">
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-1 border-t border-border pt-3">
        <span id="prefs-grid-label" className="text-small font-medium text-text-muted">
          {t('push.typesLabel')}
        </span>
        <span aria-hidden className="w-11 text-center text-tiny font-medium text-text-muted">
          {t('push.channelPush')}
        </span>
        <span aria-hidden className="w-11 text-center text-tiny font-medium text-text-muted">
          {t('push.channelEmail')}
        </span>
        {ROWS.map((row) => (
          <div key={row.label} className="contents">
            <span className="min-w-0 break-words py-1">{t(row.label)}</span>
            {([row.push, row.email] as const).map((key, index) => (
              <Switch
                key={key}
                checked={prefs.data[key]}
                aria-label={t('push.switchLabel', {
                  type: t(row.label),
                  channel: t(index === 0 ? 'push.channelPush' : 'push.channelEmail'),
                })}
                onCheckedChange={(checked) => save.mutate({ [key]: checked })}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Nhóm "Thông báo" ở trang Tài khoản: thông báo đẩy trên thiết bị này và cài đặt từng loại. */
export function NotificationSettings() {
  const { t } = useTranslation('common');
  const { status, enable, disable } = usePush();
  const test = useMutation({
    mutationFn: sendTestPush,
    onSuccess: () => toast.success(t('push.testSent')),
    onError: () => toast.error(t('push.testFailed')),
  });
  const busy = enable.isPending || disable.isPending;
  const hint = HINTS[status];

  return (
    <section
      aria-labelledby="notification-settings-title"
      className="flex w-full flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-2xs sm:p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 id="notification-settings-title" className="text-h3">
          {t('push.settingsTitle')}
        </h2>
        <p className="text-small text-text-muted">{t('push.settingsDescription')}</p>
      </div>
      {status === 'loading' ? (
        <Skeleton className="h-11 w-full" />
      ) : hint ? (
        <p role="status" className="rounded-md bg-bg px-3 py-2 text-small text-text-muted">
          {t(hint)}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 flex-col">
              <span id="push-device-label" className="font-medium">
                {t('push.deviceLabel')}
              </span>
              <span id="push-device-hint" className="text-small text-text-muted">
                {t('push.deviceHint')}
              </span>
            </span>
            <Switch
              checked={status === 'on'}
              disabled={busy}
              aria-labelledby="push-device-label"
              aria-describedby="push-device-hint"
              onCheckedChange={(next) => {
                if (next) {
                  enable.mutate(undefined, {
                    onSuccess: (result) => {
                      if (result === 'on') toast.success(t('push.enabled'));
                      else if (result === 'denied') toast.error(t('push.deniedToast'));
                    },
                    onError: () => toast.error(t('push.failed')),
                  });
                } else {
                  disable.mutate();
                }
              }}
            />
          </div>
          {status === 'on' ? (
            <Button
              variant="secondary"
              className="self-start"
              loading={test.isPending}
              onClick={() => test.mutate()}
            >
              {t('push.test')}
            </Button>
          ) : null}
        </div>
      )}
      <PrefsGrid />
    </section>
  );
}
