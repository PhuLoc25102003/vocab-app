'use client';

import { useQuery } from '@tanstack/react-query';
import type { Route } from 'next';
import Link from 'next/link';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getSetProgress } from '../api';
import { useTranslation } from 'react-i18next';

export function SetProgressSummary({ setId }: { setId: string }) {
  const { t } = useTranslation('study');
  const progress = useQuery({
    queryKey: ['stats', 'set', setId],
    queryFn: () => getSetProgress(setId),
    staleTime: 0,
  });

  if (progress.isPending) {
    return (
      <LoadingState label={t('stats.loadingProgress')}>
        <Skeleton className="h-16 w-full" />
      </LoadingState>
    );
  }
  if (progress.isError) {
    return (
      <ErrorState
        title={t('stats.progressFailed')}
        description={t('shell.checkNetwork')}
        onRetry={() => void progress.refetch()}
      />
    );
  }

  const { total, mastered, learning, notStarted, due } = progress.data;
  if (notStarted === total) {
    return <p className="text-text-muted">{t('stats.noCardsStudied')}</p>;
  }

  const items = [
    { label: t('stats.mastered'), value: mastered },
    { label: t('stats.learning'), value: learning },
    { label: t('stats.notStarted'), value: notStarted },
  ];

  return (
    <section
      aria-label={t('stats.yourProgress')}
      className="flex flex-wrap items-center gap-x-10 gap-y-3"
    >
      <dl className="flex flex-wrap gap-x-10 gap-y-3">
        {items.map(({ label, value }) => (
          <div key={label} className="flex flex-col-reverse">
            <dt className="text-small text-text-muted">{label}</dt>
            <dd className="text-h2 tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="basis-full text-small text-text-muted">{t('stats.progressRule')}</p>
      {due > 0 ? (
        <Button asChild variant="secondary">
          <Link href={`/sets/${setId}/study/flashcard?due=1` as Route}>
            {t('stats.reviewDue', { count: due })}
          </Link>
        </Button>
      ) : null}
    </section>
  );
}
