'use client';

import { useQuery } from '@tanstack/react-query';
import { ERROR_CODES } from '@vocab/shared';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LeaderboardList } from '@/components/common/leaderboard-list';
import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { HttpError } from '@/lib/http';
import { getLeaderboard, leaderboardKeys, type LeaderboardWeek } from '../api';

/** Một bảng xếp hạng đủ bốn trạng thái. `limit` cắt top cho khối ở Tổng quan. */
export function LeaderboardBoard({
  scope,
  week,
  limit,
}: {
  scope: string;
  week: LeaderboardWeek;
  limit?: number;
}) {
  const { t } = useTranslation('common');
  const board = useQuery({
    queryKey: leaderboardKeys.board(scope, week),
    queryFn: () => getLeaderboard(scope, week),
  });

  if (board.isPending) {
    return (
      <LoadingState label={t('leaderboard.loading')}>
        <Skeleton className="h-40 w-full" />
      </LoadingState>
    );
  }
  if (board.isError) {
    if (board.error instanceof HttpError && board.error.code === ERROR_CODES.LEADERBOARD_DISABLED) {
      return <EmptyState title={t('leaderboard.disabled')} />;
    }
    return (
      <ErrorState
        title={t('leaderboard.failed')}
        description={t('pages.checkNetwork')}
        onRetry={() => void board.refetch()}
      />
    );
  }
  if (board.data.entries.length === 0 && board.data.me === null) {
    return <EmptyState title={t('leaderboard.empty')} description={t('leaderboard.emptyHint')} />;
  }
  return (
    <div className="flex flex-col gap-3">
      {board.data.hidden ? (
        <p className="text-small text-text-muted">{t('leaderboard.hiddenNote')}</p>
      ) : null}
      <LeaderboardList board={board.data} limit={limit} label={t('leaderboard.list')} />
    </div>
  );
}
