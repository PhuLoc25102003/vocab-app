import { Injectable } from '@nestjs/common';
import { STUDY_DAY_OFFSET_HOURS } from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/** Báo transaction dùng thẻ phải huỷ vì đã hết thẻ. */
class NoFreezeLeft extends Error {}

const isUniqueViolation = (error: unknown) =>
  error instanceof Object && 'code' in error && error.code === 'P2002';

@Injectable()
export class StreakRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findFreezeState(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { streakFreezes: true, streakFreezeWeek: true },
    });
  }

  /** Ghi số thẻ sau khi cấp, chỉ khi chưa có lần cấp nào khác ghi trước. */
  async saveGrant(userId: string, fromWeek: string | null, held: number, week: string) {
    const { count } = await this.prisma.user.updateMany({
      where: { id: userId, streakFreezeWeek: fromWeek },
      data: { streakFreezes: held, streakFreezeWeek: week },
    });
    return count === 1;
  }

  /** Ngày học (giờ Việt Nam) có trả lời từ `since`. */
  async findStudyDaysSince(userId: string, since: Date): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<{ day: string }[]>`
      SELECT DISTINCT to_char(a."createdAt" + make_interval(hours => ${STUDY_DAY_OFFSET_HOURS}::int), 'YYYY-MM-DD') AS day
      FROM "Attempt" a
      JOIN "StudySession" s ON s.id = a."sessionId"
      WHERE s."userId" = ${userId} AND a."createdAt" >= ${since}`;
    return rows.map(({ day }) => day);
  }

  async findFrozenDays(userId: string): Promise<string[]> {
    const rows = await this.prisma.streakFreezeDay.findMany({
      where: { userId },
      orderBy: { day: 'desc' },
      take: 1000,
      select: { day: true },
    });
    return rows.map(({ day }) => day);
  }

  /** Dùng một thẻ cho `day`. Trả false nếu đã hết thẻ hoặc ngày đó đã có thẻ. */
  async useFreeze(userId: string, day: string): Promise<boolean> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.streakFreezeDay.create({ data: { userId, day } });
        const { count } = await tx.user.updateMany({
          where: { id: userId, streakFreezes: { gt: 0 } },
          data: { streakFreezes: { decrement: 1 } },
        });
        if (count === 0) {
          throw new NoFreezeLeft();
        }
      });
      return true;
    } catch (error) {
      if (error instanceof NoFreezeLeft || isUniqueViolation(error)) {
        return false;
      }
      throw error;
    }
  }
}
