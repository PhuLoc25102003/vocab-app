'use client';

import { useQuery } from '@tanstack/react-query';
import type { Route } from 'next';
import Link from 'next/link';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
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
    {
      key: 'mastered',
      label: t('stats.mastered'),
      value: mastered,
      valueColor: 'text-success',
      borderBg: 'border-success/30 bg-success-soft/30',
    },
    {
      key: 'learning',
      label: t('stats.learning'),
      value: learning,
      valueColor: 'text-primary',
      borderBg: 'border-primary/30 bg-primary-soft/30',
    },
    {
      key: 'notStarted',
      label: t('stats.notStarted'),
      value: notStarted,
      valueColor: 'text-text-muted',
      borderBg: 'border-border-strong/70 bg-surface-elevated/40',
    },
  ];

  return (
    <section
      aria-label={t('stats.yourProgress')}
      className="flex flex-col gap-3.5 rounded-xl border border-border-strong/70 bg-surface/80 p-4 sm:p-5 shadow-2xs backdrop-blur-sm"
    >
      <dl className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
        {items.map(({ key, label, value, valueColor, borderBg }) => (
          <div
            key={key}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border p-2.5 sm:p-3 text-center transition-all',
              borderBg,
            )}
          >
            <dd
              className={cn(
                'text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight',
                valueColor,
              )}
            >
              {value}
            </dd>
            <dt className="text-tiny sm:text-small font-medium text-text-muted truncate w-full mt-0.5">
              {label}
            </dt>
          </div>
        ))}
      </dl>
      <p className="text-small text-text-muted leading-relaxed border-t border-border/60 pt-3">
        {t('stats.progressRule')}
      </p>
      {due > 0 ? (
        <div className="pt-0.5">
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link href={`/sets/${setId}/study/flashcard?due=1` as Route}>
              {t('stats.reviewDue', { count: due })}
            </Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
