'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { usePublicSets } from '../hooks/use-public-sets';
import { ExploreCardActionsDropdown, ExploreContextMenuContent } from './explore-card-menu';
import { toPage } from './my-sets';
import { SetCardGrid, SetCardsLoading } from './set-cards';
import { QUERY_FIELD, SetSearchForm, toQuery } from './set-search-form';
import { useTranslation } from 'react-i18next';

export const EXPLORE_PAGE_SIZE = 20;

type ExploreAudience = 'member' | 'guest';

const AUDIENCE_PATHS: Record<ExploreAudience, { list: string; set: (id: string) => Route }> = {
  member: { list: '/explore', set: (id) => `/sets/${id}` as Route },
  guest: { list: '/public/explore', set: (id) => `/public/sets/${id}` as Route },
};

const DEFAULT_SORT = '-updatedAt';
const SORT_OPTIONS = [
  { value: DEFAULT_SORT, label: 'mine.sortUpdated' },
  { value: '-createdAt', label: 'mine.sortCreated' },
  { value: 'title', label: 'mine.sortTitle' },
  { value: '-cardCount', label: 'explore.sortCards' },
] as const;

function toSort(value: string | null): string {
  return SORT_OPTIONS.some((option) => option.value === value) ? (value as string) : DEFAULT_SORT;
}

function exploreHref(list: string, q: string, sort: string, page = 1): Route {
  const params = new URLSearchParams();
  if (q) params.set(QUERY_FIELD, q);
  if (sort !== DEFAULT_SORT) params.set('sort', sort);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return (query ? `${list}?${query}` : list) as Route;
}

export function ExploreSets({ audience = 'member' }: { audience?: ExploreAudience }) {
  const { t } = useTranslation('sets');
  const paths = AUDIENCE_PATHS[audience];
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = toQuery(searchParams.get(QUERY_FIELD));
  const sort = toSort(searchParams.get('sort'));
  const page = toPage(searchParams.get('page'));

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="min-w-0 flex-1">
          <SetSearchForm
            id="explore-search"
            value={q}
            onSearch={(value) => router.push(exploreHref(paths.list, value, sort))}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            aria-label={t('explore.sort')}
            value={sort}
            onChange={(event) => router.push(exploreHref(paths.list, q, event.target.value))}
          >
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {t(label)}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <ExploreResults q={q} sort={sort} page={page} audience={audience} />
    </>
  );
}

function ExploreResults({
  q,
  sort,
  page,
  audience,
}: {
  q: string;
  sort: string;
  page: number;
  audience: ExploreAudience;
}) {
  const { t } = useTranslation('sets');
  const paths = AUDIENCE_PATHS[audience];
  const sets = usePublicSets({ page, limit: EXPLORE_PAGE_SIZE, q, sort });

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
  if (meta.total === 0) {
    return q ? (
      <EmptyState
        title={t('noMatch')}
        description={t('explore.noMatch', { q })}
        action={
          <Button asChild variant="secondary">
            <Link href={exploreHref(paths.list, '', sort)}>{t('seeAll')}</Link>
          </Button>
        }
      />
    ) : (
      <EmptyState title={t('explore.empty')} description={t('explore.emptyHint')} />
    );
  }
  if (data.length === 0) {
    return (
      <EmptyState
        title={t('pageEmpty')}
        description={t('explore.pageEmptyHint')}
        action={
          <Button asChild variant="secondary">
            <Link href={exploreHref(paths.list, q, sort)}>{t('firstPage')}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <SetCardGrid
        sets={data}
        variant="community"
        hrefFor={paths.set}
        renderActions={(set) => (
          <ExploreCardActionsDropdown set={set} href={paths.set(set.id)} audience={audience} />
        )}
        renderContextMenu={(set) => (
          <ExploreContextMenuContent set={set} href={paths.set(set.id)} audience={audience} />
        )}
      />
      <Pagination
        page={meta.page}
        pageCount={Math.ceil(meta.total / meta.limit)}
        hrefFor={(target) => exploreHref(paths.list, q, sort, target)}
      />
    </>
  );
}
