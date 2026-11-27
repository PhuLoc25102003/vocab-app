'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Class } from '@vocab/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LeaderboardList } from '@/components/common/leaderboard-list';
import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { classKeys, getClassLeaderboard, updateClass } from '../api';

type Week = 'current' | 'previous';

/** Tab Xếp hạng ở trang lớp của giáo viên: bảng XP tuần của lớp và công tắc cho học sinh. */
export function ClassLeaderboard({ klass }: { klass: Class }) {
  const { t } = useTranslation('classes');
  const { t: tc } = useTranslation('common');
  const queryClient = useQueryClient();
  const [week, setWeek] = useState<Week>('current');
  const board = useQuery({
    queryKey: ['leaderboard', klass.id, week],
    queryFn: () => getClassLeaderboard(klass.id, week),
  });
  const toggle = useMutation({
    mutationFn: (leaderboardEnabled: boolean) => updateClass(klass.id, { leaderboardEnabled }),
    onSuccess: (updated) => {
      queryClient.setQueryData(classKeys.detail(klass.id), updated);
      toast.success(t('detail.leaderboardSaved'));
    },
    onError: () => toast.error(t('detail.leaderboardSaveFailed')),
  });
  const enabled = toggle.isPending ? toggle.variables : klass.leaderboardEnabled;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
        <span className="flex min-w-0 flex-col">
          <span id="class-leaderboard-label" className="font-medium">
            {t('detail.leaderboardSwitch')}
          </span>
          <span id="class-leaderboard-hint" className="text-small text-text-muted">
            {t('detail.leaderboardSwitchHint')}
          </span>
        </span>
        <Switch
          checked={enabled}
          disabled={toggle.isPending}
          onCheckedChange={(next) => toggle.mutate(next)}
          aria-labelledby="class-leaderboard-label"
          aria-describedby="class-leaderboard-hint"
        />
      </div>

      <div
        role="group"
        aria-label={tc('leaderboard.weeks')}
        className="glass-surface flex w-fit items-center gap-1 rounded-full border border-border p-1"
      >
        {(['current', 'previous'] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={week === option}
            onClick={() => setWeek(option)}
            className={cn(
              'min-h-11 rounded-full px-4 font-medium',
              week === option ? 'glass-button-tint' : 'glass-button-ghost text-text-muted',
            )}
          >
            {tc(option === 'current' ? 'leaderboard.thisWeek' : 'leaderboard.lastWeek')}
          </button>
        ))}
      </div>

      <div className="glass-surface rounded-xl border border-border p-2 sm:p-4">
        {board.isPending ? (
          <LoadingState label={tc('leaderboard.loading')}>
            <Skeleton className="h-40 w-full" />
          </LoadingState>
        ) : board.isError ? (
          <ErrorState
            title={tc('leaderboard.failed')}
            description={tc('pages.checkNetwork')}
            onRetry={() => void board.refetch()}
          />
        ) : board.data.entries.length === 0 ? (
          <EmptyState title={tc('leaderboard.empty')} />
        ) : (
          <LeaderboardList board={board.data} label={tc('leaderboard.list')} />
        )}
      </div>
    </section>
  );
}
