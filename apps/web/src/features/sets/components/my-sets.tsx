'use client';

import { NO_FOLDER, paginationSchema, type SetSummary } from '@vocab/shared';
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
import { useTranslation } from 'react-i18next';

export const SETS_PAGE_SIZE = 20;

export function toPage(value: string | null): number {
  const page = paginationSchema.shape.page.safeParse(value);
  return page.success ? page.data : 1;
}

const DEFAULT_SORT = '-updatedAt';
const SORT_OPTIONS = [
  { value: DEFAULT_SORT, label: 'mine.sortUpdated' },
  { value: '-createdAt', label: 'mine.sortCreated' },
  { value: 'title', label: 'mine.sortTitle' },
] as const;

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

interface MySetsProps {
  /** Thao tác trên từng thẻ, ví dụ menu thư mục, do tầng trang ghép từ feature thư mục. */
  renderCardActions?: (set: SetSummary) => ReactNode;
}

/** Thư mục đang mở nằm trong URL (`?folder=`), cột thư mục cũng đọc và đổi tham số này. */
export function MySets({ renderCardActions }: MySetsProps = {}) {
  const { t } = useTranslation('sets');
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
        <div className="flex items-end gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <SetSearchForm
              id="my-sets-search"
              value={q}
              onSearch={(value) => router.push(listHref({ ...state, q: value }))}
            />
          </div>
          <div className="w-36 shrink-0 sm:w-48">
            <SelectField
              label={t('mine.sort')}
              value={sort}
              onChange={(event) => router.push(listHref({ ...state, sort: event.target.value }))}
            >
              {SORT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {t(label)}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
      ) : null}
      <MySetsResults sets={sets} state={state} renderCardActions={renderCardActions} />
    </>
  );
}

function MySetsResults({
  sets,
  state,
  renderCardActions,
}: {
  sets: ReturnType<typeof useMySets>;
  state: ListState;
  renderCardActions?: MySetsProps['renderCardActions'];
}) {
  const { t } = useTranslation('sets');
  const { q, folder } = state;
  if (sets.isPending) {
    return <SetCardsLoading count={6} />;
  }
  if (sets.isError) {
    return (
      <ErrorState
        title={t('loadFailed')}
        description={t('checkNetwork')}
        onRetry={() => void sets.refetch()}
      />
    );
  }

  const { data, meta } = sets.data;
  if (meta.total === 0 && q) {
    return (
      <EmptyState
        title={t('noMatch')}
        description={t('mine.noMatch', { q })}
        action={
          <Button asChild variant="secondary">
            <Link href={listHref({ ...state, q: '' })}>{t('seeAll')}</Link>
          </Button>
        }
      />
    );
  }
  if (meta.total === 0 && folder) {
    return (
      <EmptyState
        title={t(folder === NO_FOLDER ? 'mine.allFiled' : 'mine.folderEmpty')}
        description={t('mine.folderEmptyHint')}
        action={
          <Button asChild variant="secondary">
            <Link href={listHref({ ...state, folder: '' })}>{t('mine.seeAllSets')}</Link>
          </Button>
        }
      />
    );
  }
  if (meta.total === 0) {
    return <EmptyState title={t('empty')} description={t('emptyHint')} />;
  }
  if (data.length === 0) {
    return (
      <EmptyState
        title={t('pageEmpty')}
        description={t('mine.pageEmptyHint')}
        action={
          <Button asChild variant="secondary">
            <Link href={listHref(state)}>{t('firstPage')}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <SetCardGrid sets={data} renderActions={renderCardActions} />
      <Pagination
        page={meta.page}
        pageCount={Math.ceil(meta.total / meta.limit)}
        hrefFor={(target) => listHref(state, target)}
      />
    </>
  );
}
