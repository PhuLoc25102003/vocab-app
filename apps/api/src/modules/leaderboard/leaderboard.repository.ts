import { Injectable } from '@nestjs/common';
import { LEADERBOARD_SIZE } from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export interface RankingRow {
  rank: number;
  displayName: string;
  xp: number;
  isMe: boolean;
}

export type RankingScope = { kind: 'global' } | { kind: 'class'; classId: string };

@Injectable()
export class LeaderboardRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Xếp theo tổng XP trong `[since, until)`, bằng XP thì ai đạt sớm hơn đứng trên.
   * Trả top `LEADERBOARD_SIZE` và dòng của `meId` nếu nằm ngoài top. Tài khoản bị khoá bị loại.
   */
  findRanking(scope: RankingScope, meId: string, since: Date, until: Date) {
    const filter =
      scope.kind === 'global'
        ? Prisma.sql`AND (u."hideFromLeaderboard" = false OR u.id = ${meId})`
        : Prisma.sql`AND u.id IN (SELECT "userId" FROM "ClassMember" WHERE "classId" = ${scope.classId})`;
    return this.prisma.$queryRaw<RankingRow[]>`
      WITH totals AS (
        SELECT u.id, u."displayName", sum(x.amount)::int AS xp, max(x."createdAt") AS last
        FROM "XpEvent" x
        JOIN "User" u ON u.id = x."userId"
        WHERE x."createdAt" >= ${since} AND x."createdAt" < ${until}
          AND u."lockedAt" IS NULL AND u."deletedAt" IS NULL
          ${filter}
        GROUP BY u.id, u."displayName"
      ), ranked AS (
        SELECT *, row_number() OVER (ORDER BY xp DESC, last ASC, id ASC)::int AS rank FROM totals
      )
      SELECT rank, "displayName", xp, (id = ${meId}) AS "isMe"
      FROM ranked
      WHERE rank <= ${LEADERBOARD_SIZE}::int OR id = ${meId}
      ORDER BY rank`;
  }

  /** Lớp mà người này dạy hoặc đang học; ADMIN xem được mọi lớp. */
  findClassForViewer(classId: string, userId: string, isAdmin: boolean) {
    return this.prisma.class.findFirst({
      where: isAdmin
        ? { id: classId }
        : { id: classId, OR: [{ teacherId: userId }, { members: { some: { userId } } }] },
      select: { teacherId: true, leaderboardEnabled: true },
    });
  }

  async isHidden(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { hideFromLeaderboard: true },
    });
    return user?.hideFromLeaderboard ?? false;
  }

  async setHidden(userId: string, hidden: boolean): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hideFromLeaderboard: hidden },
      select: { id: true },
    });
  }
}
