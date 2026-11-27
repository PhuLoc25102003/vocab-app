import {
  joinedClassListSchema,
  leaderboardResponseSchema,
  leaderboardVisibilityResponseSchema,
  type JoinedClass,
  type Leaderboard,
  type LeaderboardQuery,
} from '@vocab/shared';
import { http } from '@/lib/http';

export type LeaderboardWeek = LeaderboardQuery['week'];

export const leaderboardKeys = {
  all: ['leaderboard'] as const,
  board: (scope: string, week: LeaderboardWeek) => ['leaderboard', scope, week] as const,
  classes: ['leaderboard', 'classes'] as const,
};

/** `scope` là `global` hoặc id của lớp. */
export async function getLeaderboard(scope: string, week: LeaderboardWeek): Promise<Leaderboard> {
  const path =
    scope === 'global' ? '/leaderboard' : `/leaderboard/classes/${encodeURIComponent(scope)}`;
  return leaderboardResponseSchema.parse(await http(`${path}?week=${week}`)).data;
}

/** Lớp đã tham gia để làm tab, tối đa 100 lớp như giới hạn phân trang. */
export async function getLeaderboardClasses(): Promise<JoinedClass[]> {
  return joinedClassListSchema.parse(await http('/classes/joined?page=1&limit=100')).data;
}

export async function setLeaderboardHidden(hidden: boolean): Promise<boolean> {
  const body = await http('/leaderboard/visibility', {
    method: 'PUT',
    body: JSON.stringify({ hidden }),
  });
  return leaderboardVisibilityResponseSchema.parse(body).data.hidden;
}
