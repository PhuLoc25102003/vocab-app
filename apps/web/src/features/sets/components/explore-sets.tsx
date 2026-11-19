'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { usePublicSets } from '../hooks/use-public-sets';
import { toPage } from './my-sets';
import { SetRows, SetRowsLoading } from './set-rows';
import { QUERY_FIELD, SetSearchForm, toQuery } from './set-search-form';

export const EXPLORE_PAGE_SIZE = 20;

type ExploreAudience = 'member' | 'guest';

const AUDIENCE_PATHS: Record<ExploreAudience, { list: string; set: (id: string) => Route }> = {
  member: { list: '/explore', set: (id) => `/sets/${id}` as Route },
  guest: { list: '/public/explore', set: (id) => `/public/sets/${id}` as Route },
};

function exploreHref(list: string, q: string, page = 1): Route {
  const params = new URLSearchParams();
  if (q) params.set(QUERY_FIELD, q);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return (query ? `${list}?${query}` : list) as Route;
}

export function ExploreSets({ audience = 'member' }: { audience?: ExploreAudience }) {
  const paths = AUDIENCE_PATHS[audience];
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = toQuery(searchParams.get(QUERY_FIELD));
  const page = toPage(searchParams.get('page'));

  return (
    <>
      <SetSearchForm
        id="explore-search"
        value={q}
        onSearch={(value) => router.push(exploreHref(paths.list, value))}
      />
      <ExploreResults q={q} page={page} audience={audience} />
    </>
  );
}

function ExploreResults({
  q,
  page,
  audience,
}: {
  q: string;
  page: number;
  audience: ExploreAudience;
}) {
  const paths = AUDIENCE_PATHS[audience];
  const sets = usePublicSets({ page, limit: EXPLORE_PAGE_SIZE, q });

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
    return q ? (
      <EmptyState
        title="Không tìm thấy bộ từ phù hợp"
        description={`Chưa có bộ từ công khai nào khớp với "${q}".`}
        action={
          <Button asChild variant="secondary">
            <Link href={exploreHref(paths.list, '')}>Xem tất cả</Link>
          </Button>
        }
      />
    ) : (
      <EmptyState
        title="Chưa có bộ từ công khai"
        description="Bộ từ được đặt ở chế độ công khai sẽ hiện ở đây."
      />
    );
  }
  if (data.length === 0) {
    return (
      <EmptyState
        title="Trang này không có bộ từ"
        description="Danh sách ngắn hơn số trang này."
        action={
          <Button asChild variant="secondary">
            <Link href={exploreHref(paths.list, q)}>Về trang đầu</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <SetRows sets={data} hrefFor={paths.set} />
      <Pagination
        page={meta.page}
        pageCount={Math.ceil(meta.total / meta.limit)}
        hrefFor={(target) => exploreHref(paths.list, q, target)}
      />
    </>
  );
}
