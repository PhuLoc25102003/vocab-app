'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DAILY_GOAL_OPTIONS, XP_RULES } from '@vocab/shared';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getXpSummary, updateDailyGoal, XP_SUMMARY_KEY } from '../api';
import { XpGuide } from './xp-guide';

/** Chọn mục tiêu XP mỗi ngày ở trang Tài khoản, cùng kiểu với phần chọn ngôn ngữ. */
export function DailyGoalSettings() {
  const { t } = useTranslation('study');
  const queryClient = useQueryClient();
  const xp = useQuery({ queryKey: XP_SUMMARY_KEY, queryFn: getXpSummary });
  const save = useMutation({
    mutationFn: updateDailyGoal,
    onSuccess: (summary) => {
      queryClient.setQueryData(XP_SUMMARY_KEY, summary);
      toast.success(t('xp.goal.saved', { xp: summary.dailyGoalXp }));
    },
    onError: () => toast.error(t('xp.goal.saveFailed')),
  });

  const current = save.isPending ? save.variables.dailyGoalXp : xp.data?.dailyGoalXp;

  return (
    <section
      aria-labelledby="daily-goal-title"
      className="flex w-full flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-2xs sm:p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 id="daily-goal-title" className="scroll-mt-24 text-h3">
          {t('xp.goal.title')}
        </h2>
        <p className="text-small text-text-muted">{t('xp.goal.description')}</p>
      </div>
      {xp.isPending ? (
        <LoadingState label={t('xp.loading')}>
          <Skeleton className="h-11 w-full max-w-sm rounded-full" />
        </LoadingState>
      ) : xp.isError ? (
        <ErrorState
          title={t('xp.failed')}
          description={t('shell.checkNetwork')}
          onRetry={() => void xp.refetch()}
        />
      ) : (
        <div role="radiogroup" aria-labelledby="daily-goal-title" className="flex flex-wrap gap-2">
          {DAILY_GOAL_OPTIONS.map((goal) => (
            <button
              key={goal}
              type="button"
              role="radio"
              aria-checked={current === goal}
              disabled={save.isPending}
              onClick={() => {
                if (goal !== xp.data.dailyGoalXp) save.mutate({ dailyGoalXp: goal });
              }}
              className={cn(
                'flex min-h-11 items-center rounded-2xl px-4 py-2 font-medium disabled:opacity-70',
                current === goal ? 'glass-button-tint' : 'glass-button',
              )}
            >
              <span className="flex flex-col items-start leading-tight">
                <span className="flex items-baseline gap-2">
                  <span className="tabular-nums">{t('xp.goal.option', { xp: goal })}</span>
                  <span className="text-small opacity-80">{t(`xp.goal.names.${goal}`)}</span>
                </span>
                <span className="text-tiny opacity-80">
                  {t('xp.goal.answers', { count: goal / XP_RULES.correct })}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
      <XpGuide />
    </section>
  );
}
