'use client';

import { publicSetQuerySchema } from '@vocab/shared';
import { Search } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePublicSets } from '../hooks/use-public-sets';
import { toPage } from './my-sets';
import { SetRows, SetRowsLoading } from './set-rows';

export const EXPLORE_PAGE_SIZE = 20;
const MAX_QUERY_LENGTH = 100;
const QUERY_FIELD = 'q';

function toQuery(value: string | null): string {
  const q = publicSetQuerySchema.shape.q.safeParse(value ?? undefined);
  return q.success ? (q.data ?? '') : '';
}

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

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get(QUERY_FIELD);
    router.push(exploreHref(paths.list, typeof value === 'string' ? value.trim() : ''));
  };

  return (
    <>
      <form role="search" onSubmit={search} className="flex max-w-[560px] gap-2">
        <label htmlFor="explore-search" className="sr-only">
          Tìm bộ từ theo tên
        </label>
        <Input
          // Giữ ô tìm kiếm đúng với URL khi bấm quay lại trên trình duyệt.
          key={q}
          id="explore-search"
          name={QUERY_FIELD}
          type="search"
          defaultValue={q}
          maxLength={MAX_QUERY_LENGTH}
          placeholder="Tìm theo tên bộ từ"
        />
        <Button type="submit">
          <Search aria-hidden className="size-4" />
          Tìm
        </Button>
      </form>
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
