'use client';

import { useQuery } from '@tanstack/react-query';
import type { AdminStats } from '@vocab/shared';
import { Lock, EyeOff, ListChecks } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useId, useState, type ReactNode } from 'react';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getAdminStats } from '../api';
import { ADMIN_STATS_QUERY_KEY, HideSetButton } from './hide-set-button';

const ROLE_LABELS: Record<keyof AdminStats['roles'], string> = {
  STUDENT: 'Học sinh',
  TEACHER: 'Giáo viên',
  ADMIN: 'ADMIN',
};
const CHART_HEIGHT_PX = 120;
const number = new Intl.NumberFormat('vi-VN');
const shortDate = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

function Tile({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border-strong bg-surface p-4">
      <dd className="text-h2 tabular-nums">{number.format(value)}</dd>
      <dt className="font-medium">{label}</dt>
      {note ? <dd className="text-small text-text-muted">{note}</dd> : null}
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
            ? `${shortDate(shown.day)}: ${number.format(shown.value)} ${unit}`
            : `Tổng 30 ngày: ${number.format(total)}`}
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
            aria-label={`${shortDate(day)}: ${value} ${unit}`}
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
        <span>{points[0] ? shortDate(points[0].day) : ''}</span>
        <span>Hôm nay</span>
      </div>
      <table id={tableId} className="sr-only">
        <caption>{title} theo ngày</caption>
        <thead>
          <tr>
            <th scope="col">Ngày</th>
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
  const stats = useQuery({ queryKey: ADMIN_STATS_QUERY_KEY, queryFn: getAdminStats });

  if (stats.isPending) {
    return (
      <LoadingState label="Đang tải số liệu quản trị">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </LoadingState>
    );
  }
  if (stats.isError) {
    return (
      <ErrorState
        title="Không tải được số liệu quản trị"
        description="Hãy kiểm tra mạng rồi thử lại."
        onRetry={() => void stats.refetch()}
      />
    );
  }

  const data = stats.data;
  const roleMax = Math.max(1, ...Object.values(data.roles));

  return (
    <section aria-labelledby="admin-overview-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="admin-overview-title" className="text-h2">
          Quản trị
        </h2>
        <Button asChild variant="secondary">
          <Link href="/admin/users">Quản lý người dùng</Link>
        </Button>
      </div>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Người dùng" value={data.users} note={`+${data.newUsers} trong 7 ngày`} />
        <Tile label="Hoạt động 7 ngày" value={data.activeUsers} note="Có ít nhất một phiên học" />
        <Tile
          label="Bộ từ"
          value={data.sets}
          note={`${number.format(data.publicSets)} công khai`}
        />
        <Tile label="Phiên học 7 ngày" value={data.sessions} />
      </dl>
      <Panel title="30 ngày qua">
        <div className="grid gap-6 md:grid-cols-2">
          <DailyBars
            title="Đăng ký mới"
            unit="tài khoản"
            points={data.daily.map(({ day, signups }) => ({ day, value: signups }))}
          />
          <DailyBars
            title="Người hoạt động"
            unit="người"
            points={data.daily.map(({ day, active }) => ({ day, value: active }))}
          />
        </div>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Cần xử lý">
          <ul className="flex flex-col">
            <TodoRow
              icon={<Lock className="size-4" />}
              text={`${data.lockedUsers} tài khoản đang khoá`}
              href="/admin/users"
              action="Xem"
            />
            <TodoRow
              icon={<EyeOff className="size-4" />}
              text={`${data.hiddenSets} bộ từ đang ẩn`}
            />
            <TodoRow
              icon={<ListChecks className="size-4" />}
              text={`${data.newPublicSets.length} bộ công khai mới cần rà`}
            />
          </ul>
        </Panel>
        <Panel title="Vai trò">
          <ul className="flex flex-col gap-2">
            {(Object.keys(ROLE_LABELS) as (keyof AdminStats['roles'])[]).map((role) => (
              <li key={role} className="grid grid-cols-[6rem_4rem_1fr] items-center gap-3">
                <span>{ROLE_LABELS[role]}</span>
                <span className="text-right tabular-nums">{number.format(data.roles[role])}</span>
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
        <Panel title="Người dùng mới">
          {data.recentUsers.length === 0 ? (
            <p className="text-text-muted">Chưa có tài khoản nào.</p>
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
                    {ROLE_LABELS[user.role]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Bộ công khai mới">
          {data.newPublicSets.length === 0 ? (
            <p className="text-text-muted">Không có bộ công khai mới trong 7 ngày.</p>
          ) : (
            <ul className="flex flex-col">
              {data.newPublicSets.map((set) => (
                <li
                  key={set.id}
                  className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 border-b border-border py-2 text-small last:border-b-0"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/sets/${set.id}` as Route}
                      className="font-medium text-primary wrap-anywhere hover:underline"
                    >
                      {set.title}
                    </Link>
                    <span className="text-text-muted">
                      {set.ownerName} · {set.cardCount} thẻ
                    </span>
                  </span>
                  <HideSetButton setId={set.id} hidden={false} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </section>
  );
}
