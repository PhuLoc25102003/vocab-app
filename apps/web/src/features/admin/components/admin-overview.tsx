'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getAdminStats } from '../api';

/** Số liệu hệ thống cho ADMIN ở trang Tổng quan. */
export function AdminOverview() {
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: getAdminStats });

  if (stats.isPending) {
    return (
      <LoadingState label="Đang tải số liệu quản trị">
        <Skeleton className="h-24 w-full" />
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

  const { users, lockedUsers, sets, hiddenSets } = stats.data;
  const items = [
    { label: 'Người dùng', value: users },
    { label: 'Tài khoản bị khoá', value: lockedUsers },
    { label: 'Bộ từ', value: sets },
    { label: 'Bộ bị ẩn', value: hiddenSets },
  ];

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
        {items.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col-reverse gap-1 rounded-md border border-border bg-surface p-4"
          >
            <dt className="text-small text-text-muted">{label}</dt>
            <dd className="text-h1 tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
