import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ERROR_CODES,
  LEADERBOARD_SIZE,
  startOfStudyWeek,
  toStudyWeek,
  type LeaderboardQuery,
  type LeaderboardVisibilityInput,
} from '@vocab/shared';
import { ok } from '../../common/base/pagination';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { AppError } from '../../common/errors/app-error';
import { LeaderboardRepository, type RankingScope } from './leaderboard.repository';

const WEEK_MS = 7 * 86_400_000;

function weekRange(week: LeaderboardQuery['week'], now: Date) {
  const current = startOfStudyWeek(now);
  const since = week === 'previous' ? new Date(current.getTime() - WEEK_MS) : current;
  return { since, until: new Date(since.getTime() + WEEK_MS) };
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly leaderboard: LeaderboardRepository) {}

  async global(viewer: CurrentUserData, { week }: LeaderboardQuery) {
    const [board, hidden] = await Promise.all([
      this.board({ kind: 'global' }, viewer.id, week),
      this.leaderboard.isHidden(viewer.id),
    ]);
    return ok({ ...board, hidden, enabled: true });
  }

  /** Không thuộc lớp thì trả 404 như lớp không tồn tại, để không lộ lớp của người khác. */
  async forClass(viewer: CurrentUserData, classId: string, { week }: LeaderboardQuery) {
    const found = await this.leaderboard.findClassForViewer(
      classId,
      viewer.id,
      viewer.role === 'ADMIN',
    );
    if (!found) {
      throw new AppError(ERROR_CODES.CLASS_NOT_FOUND, 'Không tìm thấy lớp', HttpStatus.NOT_FOUND);
    }
    const canManage = viewer.role === 'ADMIN' || found.teacherId === viewer.id;
    if (!found.leaderboardEnabled && !canManage) {
      throw new AppError(
        ERROR_CODES.LEADERBOARD_DISABLED,
        'Giáo viên đã tắt bảng xếp hạng của lớp này',
        HttpStatus.FORBIDDEN,
      );
    }
    const board = await this.board({ kind: 'class', classId }, viewer.id, week);
    return ok({ ...board, hidden: false, enabled: found.leaderboardEnabled });
  }

  async setVisibility(viewer: CurrentUserData, { hidden }: LeaderboardVisibilityInput) {
    await this.leaderboard.setHidden(viewer.id, hidden);
    return ok({ hidden });
  }

  private async board(scope: RankingScope, meId: string, week: LeaderboardQuery['week']) {
    const { since, until } = weekRange(week, new Date());
    const rows = await this.leaderboard.findRanking(scope, meId, since, until);
    return {
      week: toStudyWeek(since),
      entries: rows.filter(({ rank }) => rank <= LEADERBOARD_SIZE),
      me: rows.find(({ isMe }) => isMe) ?? null,
    };
  }
}
