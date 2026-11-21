'use client';

import { useQuery } from '@tanstack/react-query';
import { Award, BookOpen, Flame, TrendingUp } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getStatsOverview } from '../api';
import { ActivityChart, MasteryBar } from './overview-charts';
import { Trans, useTranslation } from 'react-i18next';

const STAT_STYLES = {
  'stats.streak': {
    icon: Flame,
    color: 'text-highlight-fg',
    bg: 'bg-highlight',
  },
  'stats.masteredWords': {
    icon: Award,
    color: 'text-primary',
    bg: 'bg-primary-soft',
  },
  'stats.learningWords': {
    icon: BookOpen,
    color: 'text-text-muted',
    bg: 'bg-bg',
  },
  'stats.answersToday': {
    icon: TrendingUp,
    color: 'text-success',
    bg: 'bg-success-soft',
  },
} as const;

export function StatsOverview() {
  const { t } = useTranslation('study');
  const stats = useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: getStatsOverview,
    staleTime: 0,
  });

  if (stats.isPending) {
    return (
      <LoadingState label={t('stats.loading')}>
        <Skeleton className="h-20 w-full" />
      </LoadingState>
    );
  }
  if (stats.isError) {
    return (
      <ErrorState
        title={t('stats.failed')}
        description={t('shell.checkNetwork')}
        onRetry={() => void stats.refetch()}
      />
    );
  }

  const { streakDays, masteredCards, learningCards, activity, answersToday, dueCards, hardCards } =
    stats.data;
  if (
    streakDays === 0 &&
    masteredCards === 0 &&
    answersToday === 0 &&
    dueCards === 0 &&
    hardCards.length === 0
  ) {
    return (
      <EmptyState
        title={t('stats.empty')}
        description={t('stats.emptyHint')}
        action={
          <Button asChild variant="secondary">
            <Link href="/explore">{t('stats.findSets')}</Link>
          </Button>
        }
      />
    );
  }

  const items = [
    { label: 'stats.streak', value: streakDays },
    { label: 'stats.masteredWords', value: masteredCards },
    { label: 'stats.learningWords', value: learningCards },
    { label: 'stats.answersToday', value: answersToday },
  ] as const;

  return (
    <section aria-labelledby="stats-heading" className="flex flex-col gap-6">
      <h2 id="stats-heading" className="sr-only">
        {t('stats.title')}
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary-soft/60 px-4 py-3 sm:px-5 sm:py-3.5">
        <p className="font-medium text-text">
          {dueCards > 0 ? (
            <>
              <Trans
                t={t}
                i18nKey="stats.dueBanner"
                values={{ count: dueCards }}
                components={[<span key="c" className="font-semibold tabular-nums text-primary" />]}
              />
            </>
          ) : (
            t('stats.noDue')
          )}
        </p>
        <Button asChild>
          {dueCards > 0 ? (
            <Link href="/review">{t('stats.reviewNow')}</Link>
          ) : (
            <Link href="/sets">{t('stats.keepStudying')}</Link>
          )}
        </Button>
      </div>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map(({ label, value }) => {
          const style = STAT_STYLES[label];
          const Icon = style.icon;
          return (
            <div
              key={label}
              className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1.5 rounded-lg border border-border-strong bg-surface p-4 transition-colors duration-fast hover:border-primary/60 sm:p-5"
            >
              <dt className="col-span-2 row-start-2 font-medium text-text">{t(label)}</dt>
              <dd className="col-start-1 row-start-1 text-h2 font-bold tabular-nums text-text">
                {value}
              </dd>
              {label === 'stats.masteredWords' ? (
                <dd className="col-span-2 row-start-3 text-small text-text-muted">
                  {t('stats.masteredRule')}
                </dd>
              ) : null}
              <span
                aria-hidden
                className={cn(
                  'col-start-2 row-start-1 flex size-8 items-center justify-center rounded-md',
                  style.bg,
                  style.color,
                )}
              >
                <Icon className="size-4" />
              </span>
            </div>
          );
        })}
      </dl>
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityChart activity={activity} />
        <MasteryBar mastered={masteredCards} learning={learningCards} />
      </div>

      {hardCards.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-h3">{t('stats.hardWords')}</h3>
          <ul className="border-t border-border">
            {hardCards.map(({ cardId, setId, term, definition, wrongCount }) => (
              <li
                key={cardId}
                className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-border py-3"
              >
                <Link
                  href={`/sets/${setId}` as Route}
                  className="inline-flex min-h-11 min-w-11 items-center font-card wrap-anywhere"
                >
                  {term}
                </Link>
                <span className="min-w-0 flex-1 break-words text-text-muted">{definition}</span>
                <span className="text-small tabular-nums">
                  {t('stats.wrongCount', { count: wrongCount })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
