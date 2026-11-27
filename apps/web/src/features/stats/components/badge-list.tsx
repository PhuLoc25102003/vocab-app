'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BADGE_ICONS } from '@/components/common/badge-icon';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getBadges } from '../api';

/** Huy hiệu ở trang Tài khoản: mỗi huy hiệu một dòng, đã có thì sáng màu, chưa có thì hiện tiến độ. */
export function BadgeList() {
  const { t, i18n } = useTranslation('study');
  const badges = useQuery({ queryKey: ['stats', 'badges'], queryFn: getBadges });
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });

  return (
    <section
      aria-labelledby="badges-title"
      className="flex w-full flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-2xs sm:p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex flex-col gap-1">
          <h2 id="badges-title" className="text-h3">
            {t('badges.title')}
          </h2>
          <p className="text-small text-text-muted">{t('badges.description')}</p>
        </div>
        {badges.data ? (
          <span className="text-small font-medium text-text-muted tabular-nums">
            {t('badges.count', {
              earned: badges.data.filter(({ earnedAt }) => earnedAt).length,
              total: badges.data.length,
            })}
          </span>
        ) : null}
      </div>

      {badges.isPending ? (
        <LoadingState label={t('badges.loading')}>
          <Skeleton className="h-40 w-full" />
        </LoadingState>
      ) : badges.isError ? (
        <ErrorState
          title={t('badges.failed')}
          description={t('shell.checkNetwork')}
          onRetry={() => void badges.refetch()}
        />
      ) : (
        <ul className="divide-y divide-border-strong/50 border-t border-border-strong/50">
          {badges.data.map(({ code, progress, target, earnedAt }) => {
            const Icon = BADGE_ICONS[code];
            const earned = earnedAt !== null;
            return (
              <li key={code} className="flex items-center gap-3 py-3">
                <span
                  aria-hidden
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full',
                    earned ? 'bg-highlight text-highlight-fg' : 'bg-bg text-text-muted',
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className={cn('font-medium', !earned && 'text-text-muted')}>
                    {t(`badges.items.${code}.name`)}
                  </span>
                  <span className="text-small text-text-muted">
                    {t(`badges.items.${code}.rule`)}
                  </span>
                </div>
                <span className="shrink-0 text-right text-small tabular-nums">
                  {earned ? (
                    <span className="text-success">
                      {t('badges.earnedOn', { date: date.format(earnedAt) })}
                    </span>
                  ) : (
                    <span className="text-text-muted">
                      <span className="sr-only">{t('badges.locked')} </span>
                      {t('badges.progress', { progress, target })}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
