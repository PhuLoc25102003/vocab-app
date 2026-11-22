'use client';

import { useQuery } from '@tanstack/react-query';
import type { AdminStats } from '@vocab/shared';
import {
  Activity,
  BookMarked,
  EyeOff,
  Library,
  ListChecks,
  Lock,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useId, useState, type ReactNode } from 'react';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getAdminStats } from '../api';
import { ADMIN_STATS_QUERY_KEY, HideSetButton } from './hide-set-button';
import { useTranslation } from 'react-i18next';

const ROLES = [
  'STUDENT',
  'TEACHER',
  'ADMIN',
] as const satisfies readonly (keyof AdminStats['roles'])[];
const CHART_HEIGHT_PX = 120;
const formatShortDate = (day: string, locale: string) =>
  locale === 'en'
    ? `${day.slice(5, 7)}/${day.slice(8, 10)}`
    : `${day.slice(8, 10)}/${day.slice(5, 7)}`;
const formatNum = (value: number, locale: string) =>
  new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'vi-VN').format(value);

function Tile({
  label,
  value,
  note,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  label: string;
  value: number;
  note?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}) {
  const { i18n } = useTranslation();
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1.5 rounded-lg border border-border-strong bg-surface p-4 transition-colors duration-fast hover:border-primary/60 sm:p-5">
      <dt className="col-span-2 row-start-2 font-medium text-text">{label}</dt>
      <dd className="col-start-1 row-start-1 text-h2 font-bold tabular-nums text-text">
        {formatNum(value, i18n.language)}
      </dd>
      {note ? <dd className="col-span-2 row-start-3 text-small text-text-muted">{note}</dd> : null}
      {Icon ? (
        <span
          aria-hidden
          className={cn(
            'col-start-2 row-start-1 flex size-8 items-center justify-center rounded-md',
            iconBg,
            iconColor,
          )}
        >
          <Icon className="size-4" />
        </span>
      ) : null}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      aria-label={title}
      className="flex min-w-0 flex-col gap-3 rounded-lg border border-border-strong bg-surface p-4 sm:p-5"
    >
      <h3 className="text-h3">{title}</h3>
      {children}
    </section>
  );
}

/**
 * Cột 30 ngày của một số đo, một màu (theo skill dataviz: hai số đo khác nhau thì hai biểu đồ
 * nhỏ, không dùng hai trục). Rê chuột hoặc focus vào cột để xem số; bảng ẩn cho trình đọc màn hình.
 */
function DailyBars({
  title,
  unit,
  points,
}: {
  title: string;
  unit: string;
  points: { day: string; value: number }[];
}) {
  const { t, i18n } = useTranslation('admin');
  const tableId = useId();
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...points.map(({ value }) => value));
  const total = points.reduce((sum, { value }) => sum + value, 0);
  const shown = active === null ? null : points[active];
  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-semibold">{title}</span>
        <span className="text-small text-text-muted tabular-nums">
          {shown
            ? `${formatShortDate(shown.day, i18n.language)}: ${formatNum(shown.value, i18n.language)} ${unit}`
            : t('chart.total', { total: formatNum(total, i18n.language) })}
        </span>
      </figcaption>
      <div
        className="relative flex items-end gap-0.5 border-b border-border"
        style={{ height: CHART_HEIGHT_PX }}
        onMouseLeave={() => setActive(null)}
      >
        {points.map(({ day, value }, index) => (
          <button
            key={day}
            type="button"
            aria-describedby={tableId}
            aria-label={`${formatShortDate(day, i18n.language)}: ${value} ${unit}`}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onBlur={() => setActive(null)}
            className="group flex h-full min-w-0 flex-1 items-end focus-visible:outline-2"
          >
            <span
              className={`w-full rounded-t-sm transition-colors duration-fast ease-standard ${
                active === index ? 'bg-primary-hover' : 'bg-primary'
              }`}
              style={{ height: value > 0 ? Math.max(4, (value / max) * CHART_HEIGHT_PX) : 2 }}
            />
          </button>
        ))}
      </div>
      <div className="flex justify-between text-tiny text-text-muted">
        <span>{points[0] ? formatShortDate(points[0].day, i18n.language) : ''}</span>
        <span>{t('chart.today')}</span>
      </div>
      <table id={tableId} className="sr-only">
        <caption>{t('chart.caption', { title })}</caption>
        <thead>
          <tr>
            <th scope="col">{t('chart.day')}</th>
            <th scope="col">{unit}</th>
          </tr>
        </thead>
        <tbody>
          {points.map(({ day, value }) => (
            <tr key={day}>
              <th scope="row">{day}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function TodoRow({
  icon,
  text,
  href,
  action,
}: {
  icon: ReactNode;
  text: string;
  href?: Route;
  action?: string;
}) {
  return (
    <li className="flex min-h-11 items-center gap-3 border-b border-border py-2 last:border-b-0">
      <span aria-hidden className="text-text-muted">
        {icon}
      </span>
      <span className="flex-1">{text}</span>
      {href && action ? (
        <Link href={href} className="font-medium text-primary hover:underline">
          {action}
        </Link>
      ) : null}
    </li>
  );
}

/** Tổng quan ADMIN (việc 5.22): "Hệ thống có tăng trưởng không, có gì cần xử lý?". */
export function AdminOverview() {
  const { t, i18n } = useTranslation('admin');
  const stats = useQuery({ queryKey: ADMIN_STATS_QUERY_KEY, queryFn: getAdminStats });

  if (stats.isPending) {
    return (
      <LoadingState label={t('loading')}>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </LoadingState>
    );
  }
  if (stats.isError) {
    return (
      <ErrorState
        title={t('failed')}
        description={t('checkNetwork')}
        onRetry={() => void stats.refetch()}
      />
    );
  }

  const data = stats.data;
  const roleMax = Math.max(1, ...Object.values(data.roles));

  return (
    <section aria-labelledby="admin-overview-title" className="flex flex-col gap-4">
      <PageHeader
        title={t('title')}
        headingTag="h2"
        headingId="admin-overview-title"
        actions={
          <Button asChild>
            <Link href="/admin/users" className="flex items-center gap-2">
              <ShieldCheck aria-hidden className="size-4" />
              <span>{t('manageUsers')}</span>
            </Link>
          </Button>
        }
      />
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          label={t('tiles.users')}
          value={data.users}
          note={t('tiles.newUsers', { count: data.newUsers })}
          icon={Users}
          iconColor="text-primary"
          iconBg="bg-primary-soft"
        />
        <Tile
          label={t('tiles.active')}
          value={data.activeUsers}
          note={t('tiles.activeNote')}
          icon={Activity}
          iconColor="text-success"
          iconBg="bg-success-soft"
        />
        <Tile
          label={t('tiles.sets')}
          value={data.sets}
          note={t('tiles.publicSets', { count: formatNum(data.publicSets, i18n.language) })}
          icon={Library}
          iconColor="text-text-muted"
          iconBg="bg-bg"
        />
        <Tile
          label={t('tiles.sessions')}
          value={data.sessions}
          icon={BookMarked}
          iconColor="text-highlight-fg"
          iconBg="bg-highlight"
        />
      </dl>
      <Panel title={t('panels.last30')}>
        <div className="grid gap-6 md:grid-cols-2">
          <DailyBars
            title={t('charts.signups')}
            unit={t('charts.accounts')}
            points={data.daily.map(({ day, signups }) => ({ day, value: signups }))}
          />
          <DailyBars
            title={t('charts.active')}
            unit={t('charts.people')}
            points={data.daily.map(({ day, active }) => ({ day, value: active }))}
          />
        </div>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t('panels.todo')}>
          <ul className="flex flex-col">
            <TodoRow
              icon={<Lock className="size-4" />}
              text={t('todo.locked', { count: data.lockedUsers })}
              href="/admin/users"
              action={t('todo.view')}
            />
            <TodoRow
              icon={<EyeOff className="size-4" />}
              text={t('todo.hidden', { count: data.hiddenSets })}
              href="/admin/hidden-sets"
              action={t('todo.view')}
            />
            <TodoRow
              icon={<ListChecks className="size-4" />}
              text={t('todo.newPublic', { count: data.newPublicSets.length })}
            />
          </ul>
        </Panel>
        <Panel title={t('panels.roles')}>
          <ul className="flex flex-col gap-2">
            {ROLES.map((role) => (
              <li key={role} className="grid grid-cols-[6rem_4rem_1fr] items-center gap-3">
                <span>{t(`overviewRoles.${role}`)}</span>
                <span className="text-right tabular-nums">
                  {formatNum(data.roles[role], i18n.language)}
                </span>
                <span aria-hidden className="h-2 overflow-hidden rounded-full bg-border">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${(data.roles[role] / roleMax) * 100}%` }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t('panels.newUsers')}>
          {data.recentUsers.length === 0 ? (
            <p className="text-text-muted">{t('noUsers')}</p>
          ) : (
            <ul className="flex flex-col">
              {data.recentUsers.map((user) => (
                <li
                  key={user.id}
                  className="flex min-h-11 flex-wrap items-center gap-x-3 border-b border-border py-2 text-small last:border-b-0"
                >
                  <span className="font-medium wrap-anywhere">{user.displayName}</span>
                  <span className="min-w-0 truncate text-text-muted" title={user.email}>
                    {user.email}
                  </span>
                  <span className="ml-auto rounded-sm bg-primary-soft px-2 text-tiny text-primary">
                    {t(`overviewRoles.${user.role}`)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title={t('panels.newPublic')}>
          {data.newPublicSets.length === 0 ? (
            <p className="text-text-muted">{t('noNewPublic')}</p>
          ) : (
            <ul className="flex flex-col">
              {data.newPublicSets.map((set) => (
                <li
                  key={set.id}
                  className="flex items-center justify-between gap-3 border-b border-border py-2.5 text-small last:border-b-0"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/sets/${set.id}` as Route}
                      className="font-medium text-primary truncate hover:underline"
                      title={set.title}
                    >
                      {set.title}
                    </Link>
                    <span className="text-text-muted truncate">
                      {t('setMeta', { owner: set.ownerName, count: set.cardCount })}
                    </span>
                  </span>
                  <div className="shrink-0">
                    <HideSetButton setId={set.id} hidden={false} className="w-auto" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </section>
  );
}
