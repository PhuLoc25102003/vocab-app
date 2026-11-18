'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { useMySets } from '../hooks/use-my-sets';
import { SetRows, SetRowsLoading } from './set-rows';

const RECENT_SETS_LIMIT = 5;

export function RecentSets() {
  const sets = useMySets({ page: 1, limit: RECENT_SETS_LIMIT });

  if (sets.isPending) {
    return <SetRowsLoading count={3} />;
  }
  if (sets.isError) {
    return (
      <ErrorState
        title="Không tải được bộ từ gần đây"
        description="Hãy kiểm tra mạng rồi thử lại."
        onRetry={() => void sets.refetch()}
      />
    );
  }

  const { data, meta } = sets.data;
  if (meta.total === 0) {
    return (
      <EmptyState
        title="Chưa có bộ từ nào"
        description="Tạo bộ đầu tiên để bắt đầu học."
        action={
          <Button asChild>
            <Link href="/sets/new">Tạo bộ từ</Link>
          </Button>
        }
      />
    );
  }

  return (
    <section aria-labelledby="recent-sets" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4">
        <h2 id="recent-sets" className="text-h2">
          Bộ từ gần đây
        </h2>
        {meta.total > data.length ? (
          <Link
            href="/sets"
            className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4"
          >
            Xem tất cả {meta.total} bộ từ
          </Link>
        ) : null}
      </div>
      <SetRows sets={data} />
    </section>
  );
}
