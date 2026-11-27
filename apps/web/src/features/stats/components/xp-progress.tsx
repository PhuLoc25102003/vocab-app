'use client';

import { useQuery } from '@tanstack/react-query';
import { CircleCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getXpSummary, XP_SUMMARY_KEY } from '../api';

/** Chu vi vòng tròn bán kính 15.915 bằng 100, nên phần trăm dùng thẳng cho `stroke-dasharray`. */
const RING_RADIUS = 15.915;

function GoalRing({ today, goal }: { today: number; goal: number }) {
  const { t } = useTranslation('study');
  const done = today >= goal;
  const percent = goal > 0 ? Math.min(100, Math.round((today / goal) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={t('xp.todayRing', { today, goal })}
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-valuenow={Math.min(today, goal)}
      className="relative size-20 shrink-0 sm:size-24"
    >
      <svg viewBox="0 0 36 36" aria-hidden className="size-full -rotate-90">
        <circle
          cx="18"
          cy="18"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="3.5"
          className="stroke-primary-soft"
        />
        <circle
          cx="18"
          cy="18"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${percent} 100`}
          className={cn(
            'transition-[stroke-dasharray] duration-base ease-standard',
            done ? 'stroke-success' : 'stroke-primary',
          )}
        />
      </svg>
      <span aria-hidden className="absolute inset-0 flex flex-col items-center justify-center">
        {done ? (
          <CircleCheck className="size-7 text-success" />
        ) : (
          <>
            <span className="text-h3 font-bold leading-none tabular-nums">{today}</span>
            <span className="text-tiny text-text-muted tabular-nums">/{goal} XP</span>
          </>
        )}
      </span>
    </div>
  );
}

/** Khối XP trên Tổng quan: vòng tròn mục tiêu ngày, cấp độ và thanh lên cấp. */
export function XpProgress() {
  const { t, i18n } = useTranslation('study');
  const xp = useQuery({ queryKey: XP_SUMMARY_KEY, queryFn: getXpSummary, staleTime: 0 });

  if (xp.isPending) {
    return (
      <LoadingState label={t('xp.loading')}>
        <Skeleton className="h-28 w-full rounded-xl" />
      </LoadingState>
    );
  }
  if (xp.isError) {
    return (
      <ErrorState
        title={t('xp.failed')}
        description={t('shell.checkNetwork')}
        onRetry={() => void xp.refetch()}
      />
    );
  }

  const { totalXp, level, xpIntoLevel, xpForNextLevel, todayXp, dailyGoalXp } = xp.data;
  const done = todayXp >= dailyGoalXp;
  const levelPercent = Math.round((xpIntoLevel / xpForNextLevel) * 100);
  const format = new Intl.NumberFormat(i18n.language);

  return (
    <section
      aria-labelledby="xp-heading"
      className="glass-surface flex items-center gap-4 rounded-xl border border-border p-4 sm:gap-6 sm:p-5"
    >
      <GoalRing today={todayXp} goal={dailyGoalXp} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 id="xp-heading" className="flex items-center gap-2 text-h3">
            <Sparkles aria-hidden className="size-5 text-primary" />
            {t('xp.level', { level })}
          </h2>
          <span className="text-small font-medium text-text-muted tabular-nums">
            {t('xp.total', { xp: format.format(totalXp) })}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={t('xp.levelBar', { level: level + 1 })}
          aria-valuemin={0}
          aria-valuemax={xpForNextLevel}
          aria-valuenow={xpIntoLevel}
          className="h-2 w-full overflow-hidden rounded-full bg-primary-soft"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-base ease-standard"
            style={{ width: `${levelPercent}%` }}
          />
        </div>
        <p className="text-small text-text-muted">
          {t('xp.toNextLevel', {
            xp: format.format(xpForNextLevel - xpIntoLevel),
            level: level + 1,
          })}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-x-3">
          <p className={cn('font-medium', done ? 'text-success' : 'text-text')}>
            {totalXp === 0
              ? t('xp.firstXp')
              : done
                ? t('xp.goalDone')
                : t('xp.goalLeft', { xp: dailyGoalXp - todayXp })}
          </p>
          <Link
            href="/account#daily-goal-title"
            className="inline-flex min-h-11 items-center text-small font-medium text-primary underline-offset-4 hover:underline"
          >
            {t('xp.changeGoal')}
          </Link>
        </div>
      </div>
    </section>
  );
}
