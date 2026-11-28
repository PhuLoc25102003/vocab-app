import { Injectable } from '@nestjs/common';
import { MASTERED_INTERVAL_DAYS, STUDY_DAY_OFFSET_HOURS } from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/** Giờ bắt đầu và kết thúc (không gồm) của khung "cú đêm" theo giờ Việt Nam. */
const NIGHT_FROM_HOUR = 23;
const NIGHT_TO_HOUR = 4;

@Injectable()
export class BadgeRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId },
      select: { code: true, earnedAt: true },
    });
  }

  /** Thêm huy hiệu, bỏ qua mã đã có. */
  async addBadges(userId: string, codes: readonly string[], now: Date): Promise<void> {
    await this.prisma.userBadge.createMany({
      data: codes.map((code) => ({ userId, code, earnedAt: now })),
      skipDuplicates: true,
    });
  }

  countMastered(userId: string) {
    return this.prisma.cardProgress.count({
      where: { userId, interval: { gte: MASTERED_INTERVAL_DAYS } },
    });
  }

  /**
   * Số phiên Kiểm tra đúng hết, số bộ đã học xong, số ngày đạt mục tiêu XP, số ngày học đêm và
   * điểm Mưa từ cao nhất.
   */
  async countActivity(userId: string) {
    const [row] = await this.prisma.$queryRaw<
      {
        perfectTests: number;
        setsStudied: number;
        goalDays: number;
        nightDays: number;
        wordRainBest: number;
      }[]
    >`
      SELECT
        (SELECT count(*)::int FROM "StudySession"
          WHERE "userId" = ${userId} AND mode = 'TEST' AND "finishedAt" IS NOT NULL
            AND total > 0 AND correct = total) AS "perfectTests",
        (SELECT count(DISTINCT "setId")::int FROM "StudySession"
          WHERE "userId" = ${userId} AND "finishedAt" IS NOT NULL) AS "setsStudied",
        (SELECT count(*)::int FROM (
          SELECT 1 FROM "XpEvent" x
          WHERE x."userId" = ${userId}
          GROUP BY date(x."createdAt" + make_interval(hours => ${STUDY_DAY_OFFSET_HOURS}::int))
          HAVING sum(x.amount) >= (SELECT "dailyGoalXp" FROM "User" WHERE id = ${userId})
        ) g) AS "goalDays",
        (SELECT count(DISTINCT date(a."createdAt" + make_interval(hours => ${STUDY_DAY_OFFSET_HOURS}::int)))::int
          FROM "Attempt" a JOIN "StudySession" s ON s.id = a."sessionId"
          WHERE s."userId" = ${userId}
            AND (extract(hour FROM a."createdAt" + make_interval(hours => ${STUDY_DAY_OFFSET_HOURS}::int)) >= ${NIGHT_FROM_HOUR}
              OR extract(hour FROM a."createdAt" + make_interval(hours => ${STUDY_DAY_OFFSET_HOURS}::int)) < ${NIGHT_TO_HOUR})
        ) AS "nightDays",
        (SELECT coalesce(max(score), 0)::int FROM "GameHighScore"
          WHERE "userId" = ${userId}) AS "wordRainBest"`;
    return row ?? { perfectTests: 0, setsStudied: 0, goalDays: 0, nightDays: 0, wordRainBest: 0 };
  }
}
