import {
  joinedClassListSchema,
  leaderboardResponseSchema,
  leaderboardVisibilityResponseSchema,
  type JoinedClassList,
  type Leaderboard,
  type LeaderboardQuery,
} from '@vocab/shared';
import { http } from '@/lib/http';

export type LeaderboardWeek = LeaderboardQuery['week'];

export const leaderboardKeys = {
  all: ['leaderboard'] as const,
  board: (scope: string, week: LeaderboardWeek) => ['leaderboard', scope, week] as const,
};

/**
 * Mọi lớp đã tham gia để làm tab. Cùng khoá và cùng dữ liệu với `allJoinedClassesQuery` của trang
 * Lớp học (feature không import lẫn nhau), nên hai trang dùng chung một request.
 */
export const joinedClassesQuery = {
  queryKey: ['classes', 'joined', 1, '', 100] as const,
  queryFn: async (): Promise<JoinedClassList> =>
    joinedClassListSchema.parse(await http('/classes/joined?page=1&limit=100')),
};

/** `scope` là `global` hoặc id của lớp. */
export async function getLeaderboard(scope: string, week: LeaderboardWeek): Promise<Leaderboard> {
  const path =
    scope === 'global' ? '/leaderboard' : `/leaderboard/classes/${encodeURIComponent(scope)}`;
  return leaderboardResponseSchema.parse(await http(`${path}?week=${week}`)).data;
}

export async function setLeaderboardHidden(hidden: boolean): Promise<boolean> {
  const body = await http('/leaderboard/visibility', {
    method: 'PUT',
    body: JSON.stringify({ hidden }),
  });
  return leaderboardVisibilityResponseSchema.parse(body).data.hidden;
}
