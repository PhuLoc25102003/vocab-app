'use client';

import { paginationSchema } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { useMySets } from '../hooks/use-my-sets';
import { SetRows, SetRowsLoading } from './set-rows';

export const SETS_PAGE_SIZE = 20;

export function toPage(value: string | null): number {
  const page = paginationSchema.shape.page.safeParse(value);
  return page.success ? page.data : 1;
}

function pageHref(page: number): Route {
  return (page === 1 ? '/sets' : `/sets?page=${page}`) as Route;
}

export function MySets() {
  const page = toPage(useSearchParams().get('page'));
  const sets = useMySets({ page, limit: SETS_PAGE_SIZE });

  if (sets.isPending) {
    return <SetRowsLoading count={5} />;
  }
  if (sets.isError) {
    return (
      <ErrorState
        title="Không tải được bộ từ"
        description="Hãy kiểm tra mạng rồi thử lại."
        onRetry={() => void sets.refetch()}
      />
    );
  }

  const { data, meta } = sets.data;
  if (meta.total === 0) {
    return <EmptyState title="Chưa có bộ từ nào" description="Tạo bộ đầu tiên để bắt đầu học." />;
  }
  if (data.length === 0) {
    return (
      <EmptyState
        title="Trang này không có bộ từ"
        description="Danh sách của bạn ngắn hơn số trang này."
        action={
          <Button asChild variant="secondary">
            <Link href={pageHref(1)}>Về trang đầu</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <SetRows sets={data} />
      <Pagination
        page={meta.page}
        pageCount={Math.ceil(meta.total / meta.limit)}
        hrefFor={pageHref}
      />
    </>
  );
}
