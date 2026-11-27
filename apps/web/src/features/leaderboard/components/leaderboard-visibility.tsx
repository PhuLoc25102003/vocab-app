'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { getLeaderboard, leaderboardKeys, setLeaderboardHidden } from '../api';

/** Công tắc ẩn tên khỏi bảng xếp hạng chung ở trang Tài khoản. */
export function LeaderboardVisibility() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const board = useQuery({
    queryKey: leaderboardKeys.board('global', 'current'),
    queryFn: () => getLeaderboard('global', 'current'),
  });
  const save = useMutation({
    mutationFn: setLeaderboardHidden,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leaderboardKeys.all });
      toast.success(t('leaderboard.visibility.saved'));
    },
    onError: () => toast.error(t('leaderboard.visibility.failed')),
  });
  const hidden = save.isPending ? save.variables : (board.data?.hidden ?? false);

  return (
    <section
      aria-labelledby="leaderboard-visibility-title"
      className="flex w-full flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-2xs sm:p-5"
    >
      <h2 id="leaderboard-visibility-title" className="text-h3">
        {t('leaderboard.visibility.title')}
      </h2>
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 flex-col">
          <span id="leaderboard-hide-label" className="font-medium">
            {t('leaderboard.visibility.label')}
          </span>
          <span id="leaderboard-hide-hint" className="text-small text-text-muted">
            {t('leaderboard.visibility.hint')}
          </span>
        </span>
        <Switch
          checked={hidden}
          disabled={board.isPending || save.isPending}
          onCheckedChange={(next) => save.mutate(next)}
          aria-labelledby="leaderboard-hide-label"
          aria-describedby="leaderboard-hide-hint"
        />
      </div>
    </section>
  );
}
