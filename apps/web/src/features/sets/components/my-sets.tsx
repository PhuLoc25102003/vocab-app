'use client';

import { paginationSchema } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { EmptyState } from '@/components/common/empty-state';
import { SelectField } from '@/components/common/form-field';
import { ErrorState } from '@/components/common/error-state';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { useMySets } from '../hooks/use-my-sets';
import { SetRows, SetRowsLoading } from './set-rows';
import { QUERY_FIELD, SetSearchForm, toQuery } from './set-search-form';

export const SETS_PAGE_SIZE = 20;

export function toPage(value: string | null): number {
  const page = paginationSchema.shape.page.safeParse(value);
  return page.success ? page.data : 1;
}

const DEFAULT_SORT = '-updatedAt';
const SORT_OPTIONS = [
  { value: DEFAULT_SORT, label: 'Mới cập nhật' },
  { value: '-createdAt', label: 'Mới tạo' },
  { value: 'title', label: 'Tên từ A đến Z' },
];

function toSort(value: string | null): string {
  return SORT_OPTIONS.some((option) => option.value === value) ? (value as string) : DEFAULT_SORT;
}

function listHref(q: string, sort: string, page = 1): Route {
  const params = new URLSearchParams();
  if (q) params.set(QUERY_FIELD, q);
  if (sort !== DEFAULT_SORT) params.set('sort', sort);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return (query ? `/sets?${query}` : '/sets') as Route;
}

export function MySets() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = toPage(searchParams.get('page'));
  const q = toQuery(searchParams.get(QUERY_FIELD));
  const sort = toSort(searchParams.get('sort'));
  const isCustomSort = sort !== DEFAULT_SORT;
  const sets = useMySets({
    page,
    limit: SETS_PAGE_SIZE,
    ...(q ? { q } : {}),
    ...(isCustomSort ? { sort } : {}),
  });
  const hasTools = Boolean(q) || isCustomSort || (sets.data?.meta.total ?? 0) > 0;

  return (
    <>
      {hasTools ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-72">
            <SetSearchForm
              id="my-sets-search"
              value={q}
              onSearch={(value) => router.push(listHref(value, sort))}
            />
          </div>
          <SelectField
            label="Sắp xếp"
            value={sort}
            onChange={(event) => router.push(listHref(q, event.target.value))}
          >
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
        </div>
      ) : null}
      <MySetsResults sets={sets} q={q} sort={sort} />
    </>
  );
}

function MySetsResults({
  sets,
  q,
  sort,
}: {
  sets: ReturnType<typeof useMySets>;
  q: string;
  sort: string;
}) {
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
  if (meta.total === 0 && q) {
    return (
      <EmptyState
        title="Không tìm thấy bộ từ phù hợp"
        description={`Bạn chưa có bộ từ nào khớp với "${q}".`}
        action={
          <Button asChild variant="secondary">
            <Link href={listHref('', sort)}>Xem tất cả</Link>
          </Button>
        }
      />
    );
  }
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
            <Link href={listHref(q, sort)}>Về trang đầu</Link>
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
        hrefFor={(target) => listHref(q, sort, target)}
      />
    </>
  );
}
