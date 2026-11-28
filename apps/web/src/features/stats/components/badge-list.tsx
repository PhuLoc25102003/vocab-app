'use client';

import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BADGE_ICONS } from '@/components/common/badge-icon';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { BADGES_KEY, getBadges } from '../api';

/**
 * Huy hiệu ở trang Tài khoản, mỗi huy hiệu một ô: đã có thì sáng màu kèm ngày nhận, chưa có thì
 * hiện thanh tiến độ. Mốc khó có nhãn "Thử thách".
 */
export function BadgeList() {
  const { t, i18n } = useTranslation('study');
  const badges = useQuery({ queryKey: BADGES_KEY, queryFn: getBadges });
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });
  const number = new Intl.NumberFormat(i18n.language);

  return (
    <section
      aria-labelledby="badges-title"
      className="flex w-full flex-col gap-4 rounded-lg border border-border bg-surface p-4 shadow-2xs sm:p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex flex-col gap-1">
          <h2 id="badges-title" className="scroll-mt-24 text-h3">
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
        <ul className="grid gap-3 sm:grid-cols-2">
          {badges.data.map(({ code, progress, target, earnedAt, hard }) => {
            const Icon = BADGE_ICONS[code];
            const earned = earnedAt !== null;
            const percent = Math.round((progress / target) * 100);
            return (
              <li
                key={code}
                className={cn(
                  'flex gap-3 rounded-xl border p-3',
                  earned ? 'glass-surface border-border' : 'border-border-strong/50 border-dashed',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-full',
                    earned ? 'bg-highlight text-highlight-fg' : 'bg-bg text-text-muted',
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className={cn('font-medium break-words', !earned && 'text-text-muted')}>
                      {t(`badges.items.${code}.name`)}
                    </span>
                    {hard ? (
                      <span className="rounded-sm bg-primary-soft px-1.5 text-tiny font-medium text-primary">
                        {t('badges.hard')}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-small text-text-muted break-words">
                    {t(`badges.items.${code}.rule`)}
                  </span>
                  {earned ? (
                    <span className="flex items-center gap-1 text-small font-medium text-success">
                      <Check aria-hidden className="size-4" />
                      <span className="sr-only">{t('badges.earned')}. </span>
                      {t('badges.earnedOn', { date: date.format(earnedAt) })}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div
                        role="progressbar"
                        aria-label={t(`badges.items.${code}.name`)}
                        aria-valuemin={0}
                        aria-valuemax={target}
                        aria-valuenow={progress}
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary-soft"
                      >
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-small text-text-muted tabular-nums">
                        <span className="sr-only">{t('badges.locked')} </span>
                        {t('badges.progress', {
                          progress: number.format(progress),
                          target: number.format(target),
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
