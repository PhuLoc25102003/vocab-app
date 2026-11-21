'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { useMySets } from '../hooks/use-my-sets';
import { SetCardGrid, SetCardsLoading } from './set-cards';
import { useTranslation } from 'react-i18next';

/** Hai hàng thẻ ở màn hình rộng. */
const RECENT_SETS_LIMIT = 6;

export function RecentSets() {
  const { t } = useTranslation('sets');
  const sets = useMySets({ page: 1, limit: RECENT_SETS_LIMIT });

  if (sets.isPending) {
    return <SetCardsLoading count={3} />;
  }
  if (sets.isError) {
    return (
      <ErrorState
        title={t('recent.failed')}
        description={t('checkNetwork')}
        onRetry={() => void sets.refetch()}
      />
    );
  }

  const { data, meta } = sets.data;
  if (meta.total === 0) {
    return (
      <EmptyState
        title={t('empty')}
        description={t('emptyHint')}
        action={
          <Button asChild>
            <Link href="/sets/new">{t('recent.create')}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <section aria-labelledby="recent-sets" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4">
        <h2 id="recent-sets" className="text-h2">
          {t('recent.title')}
        </h2>
        {meta.total > data.length ? (
          <Link
            href="/sets"
            className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4"
          >
            {t('recent.seeAll', { count: meta.total })}
          </Link>
        ) : null}
      </div>
      <SetCardGrid sets={data} />
    </section>
  );
}
