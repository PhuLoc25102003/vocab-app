'use client';

import { NO_FOLDER, paginationSchema, type SetSummary, type Visibility } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useMySets } from '../hooks/use-my-sets';
import { SetCardGrid, SetCardsLoading } from './set-cards';
import type { SetCardShellProps } from '@/components/common/set-card-shell';
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
export const VISIBILITY_FIELD = 'visibility';

const VISIBILITY_OPTIONS = [
  { value: '', label: 'mine.allVisibilities' },
  { value: 'PRIVATE', label: 'mine.visibilityPrivate' },
  { value: 'PUBLIC', label: 'mine.visibilityPublic' },
  { value: 'CLASS', label: 'mine.visibilityClass' },
] as const;

function toVisibility(value: string | null): string {
  return VISIBILITY_OPTIONS.some((option) => option.value === value) ? (value as string) : '';
}

interface ListState {
  q: string;
  sort: string;
  folder: string;
  visibility: string;
}

function listHref({ q, sort, folder, visibility }: ListState, page = 1): Route {
  const params = new URLSearchParams();
  if (q) params.set(QUERY_FIELD, q);
  if (sort !== DEFAULT_SORT) params.set('sort', sort);
  if (folder) params.set(FOLDER_FIELD, folder);
  if (visibility) params.set(VISIBILITY_FIELD, visibility);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return (query ? `/sets?${query}` : '/sets') as Route;
}

interface MySetsProps {
  /** Thao tác trên từng thẻ, ví dụ menu thư mục, do tầng trang ghép từ feature thư mục. */
  renderCardActions?: (set: SetSummary) => ReactNode;
  /** Menu chuột phải trên từng thẻ */
  renderContextMenu?: (set: SetSummary) => ReactNode;
  /** Tuỳ biến render thẻ, ví dụ để gắn kéo thả */
  renderCard?: (set: SetSummary, props: SetCardShellProps) => ReactNode;
}

/** Thư mục đang mở nằm trong URL (`?folder=`), cột thư mục cũng đọc và đổi tham số này. */
export function MySets({ renderCardActions, renderContextMenu, renderCard }: MySetsProps = {}) {
  const { t } = useTranslation('sets');
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = toPage(searchParams.get('page'));
  const q = toQuery(searchParams.get(QUERY_FIELD));
  const sort = toSort(searchParams.get('sort'));
  const folder = searchParams.get(FOLDER_FIELD)?.slice(0, 64) ?? '';
  const visibility = toVisibility(searchParams.get(VISIBILITY_FIELD));
  const state: ListState = { q, sort, folder, visibility };
  const isCustomSort = sort !== DEFAULT_SORT;
  const sets = useMySets({
    page,
    limit: SETS_PAGE_SIZE,
    ...(q ? { q } : {}),
    ...(isCustomSort ? { sort } : {}),
    ...(folder ? { folderId: folder } : {}),
    ...(visibility ? { visibility: visibility as Visibility } : {}),
  });
  const hasTools =
    Boolean(q) ||
    Boolean(folder) ||
    Boolean(visibility) ||
    isCustomSort ||
    (sets.data?.meta.total ?? 0) > 0;

  return (
    <>
      {hasTools ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1">
            <SetSearchForm
              id="my-sets-search"
              value={q}
              onSearch={(value) => router.push(listHref({ ...state, q: value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
            <div className="w-full sm:w-48 shrink-0">
              <Select
                aria-label={t('mine.filterVisibility')}
                value={visibility}
                onChange={(event) =>
                  router.push(listHref({ ...state, visibility: event.target.value }))
                }
              >
                {VISIBILITY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {t(label)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-full sm:w-52 shrink-0">
              <Select
                aria-label={t('mine.sort')}
                value={sort}
                onChange={(event) => router.push(listHref({ ...state, sort: event.target.value }))}
              >
                {SORT_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {t(label)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      ) : null}
      <MySetsResults
        sets={sets}
        state={state}
        renderCardActions={renderCardActions}
        renderContextMenu={renderContextMenu}
        renderCard={renderCard}
      />
    </>
  );
}

function MySetsResults({
  sets,
  state,
  renderCardActions,
  renderContextMenu,
  renderCard,
}: {
  sets: ReturnType<typeof useMySets>;
  state: ListState;
  renderCardActions?: MySetsProps['renderCardActions'];
  renderContextMenu?: MySetsProps['renderContextMenu'];
  renderCard?: MySetsProps['renderCard'];
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
      <SetCardGrid
        sets={data}
        renderActions={renderCardActions}
        renderContextMenu={renderContextMenu}
        renderCard={renderCard}
      />
      <Pagination
        page={meta.page}
        pageCount={Math.ceil(meta.total / meta.limit)}
        hrefFor={(target) => listHref(state, target)}
      />
    </>
  );
}
