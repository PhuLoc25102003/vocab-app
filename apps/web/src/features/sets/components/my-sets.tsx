'use client';

import { paginationSchema } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { SelectField } from '@/components/common/form-field';
import { ErrorState } from '@/components/common/error-state';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { useMySets } from '../hooks/use-my-sets';
import { SetCardGrid, SetCardsLoading } from './set-cards';
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

export const FOLDER_FIELD = 'folder';

interface ListState {
  q: string;
  sort: string;
  folder: string;
}

function listHref({ q, sort, folder }: ListState, page = 1): Route {
  const params = new URLSearchParams();
  if (q) params.set(QUERY_FIELD, q);
  if (sort !== DEFAULT_SORT) params.set('sort', sort);
  if (folder) params.set(FOLDER_FIELD, folder);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return (query ? `/sets?${query}` : '/sets') as Route;
}

export interface FolderFilterProps {
  /** Id thư mục, `none`, hoặc chuỗi rỗng nghĩa là tất cả. */
  value: string;
  onChange: (value: string) => void;
}

interface MySetsProps {
  /** Ô lọc theo thư mục, do tầng trang ghép từ feature thư mục. */
  renderFolderFilter?: (props: FolderFilterProps) => ReactNode;
}

export function MySets({ renderFolderFilter }: MySetsProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = toPage(searchParams.get('page'));
  const q = toQuery(searchParams.get(QUERY_FIELD));
  const sort = toSort(searchParams.get('sort'));
  const folder = searchParams.get(FOLDER_FIELD)?.slice(0, 64) ?? '';
  const state: ListState = { q, sort, folder };
  const isCustomSort = sort !== DEFAULT_SORT;
  const sets = useMySets({
    page,
    limit: SETS_PAGE_SIZE,
    ...(q ? { q } : {}),
    ...(isCustomSort ? { sort } : {}),
    ...(folder ? { folderId: folder } : {}),
  });
  const hasTools =
    Boolean(q) || Boolean(folder) || isCustomSort || (sets.data?.meta.total ?? 0) > 0;

  return (
    <>
      {hasTools ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-72">
            <SetSearchForm
              id="my-sets-search"
              value={q}
              onSearch={(value) => router.push(listHref({ ...state, q: value }))}
            />
          </div>
          <SelectField
            label="Sắp xếp"
            value={sort}
            onChange={(event) => router.push(listHref({ ...state, sort: event.target.value }))}
          >
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
          {renderFolderFilter?.({
            value: folder,
            onChange: (value) => router.push(listHref({ ...state, folder: value })),
          })}
        </div>
      ) : null}
      <MySetsResults sets={sets} state={state} />
    </>
  );
}

function MySetsResults({ sets, state }: { sets: ReturnType<typeof useMySets>; state: ListState }) {
  const { q, folder } = state;
  if (sets.isPending) {
    return <SetCardsLoading count={6} />;
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
            <Link href={listHref({ ...state, q: '' })}>Xem tất cả</Link>
          </Button>
        }
      />
    );
  }
  if (meta.total === 0 && folder) {
    return (
      <EmptyState
        title="Thư mục này chưa có bộ từ"
        description="Mở một bộ từ rồi chọn thư mục để chuyển bộ vào đây."
        action={
          <Button asChild variant="secondary">
            <Link href={listHref({ ...state, folder: '' })}>Xem tất cả</Link>
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
            <Link href={listHref(state)}>Về trang đầu</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <SetCardGrid sets={data} />
      <Pagination
        page={meta.page}
        pageCount={Math.ceil(meta.total / meta.limit)}
        hrefFor={(target) => listHref(state, target)}
      />
    </>
  );
}
