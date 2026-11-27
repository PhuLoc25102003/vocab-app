import { Injectable } from '@nestjs/common';
import { MASTERED_INTERVAL_DAYS, STUDY_DAY_OFFSET_HOURS } from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { visibleTo, type SetViewer } from '../sets/sets.repository';

const HARD_CARD_LIMIT = 5;
/** Đủ cho chuỗi học dài nhiều năm mà không đọc toàn bộ lịch sử. */
const STUDY_DAY_LIMIT = 1000;

@Injectable()
export class StatsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findStudyDays(userId: string): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<{ day: string }[]>`
      SELECT DISTINCT to_char(a."createdAt" + make_interval(hours => ${STUDY_DAY_OFFSET_HOURS}::int), 'YYYY-MM-DD') AS day
      FROM "Attempt" a
      JOIN "StudySession" s ON s.id = a."sessionId"
      WHERE s."userId" = ${userId}
      ORDER BY day DESC
      LIMIT ${STUDY_DAY_LIMIT}::int`;
    return rows.map(({ day }) => day);
  }

  /** Số câu trả lời theo ngày học (giờ Việt Nam) từ `since`. */
  async countAnswersByDay(userId: string, since: Date): Promise<Map<string, number>> {
    const rows = await this.prisma.$queryRaw<{ day: string; answers: number }[]>`
      SELECT to_char(a."createdAt" + make_interval(hours => ${STUDY_DAY_OFFSET_HOURS}::int), 'YYYY-MM-DD') AS day,
        COUNT(*)::int AS answers
      FROM "Attempt" a
      JOIN "StudySession" s ON s.id = a."sessionId"
      WHERE s."userId" = ${userId} AND a."createdAt" >= ${since}
      GROUP BY day`;
    return new Map(rows.map(({ day, answers }) => [day, answers]));
  }

  countLearning(viewer: SetViewer) {
    return this.prisma.cardProgress.count({
      where: {
        userId: viewer.id,
        interval: { lt: MASTERED_INTERVAL_DAYS },
        card: { set: { deletedAt: null, ...visibleTo(viewer) } },
      },
    });
  }

  countMastered(viewer: SetViewer) {
    return this.prisma.cardProgress.count({
      where: {
        userId: viewer.id,
        interval: { gte: MASTERED_INTERVAL_DAYS },
        card: { set: { deletedAt: null, ...visibleTo(viewer) } },
      },
    });
  }

  countDue(viewer: SetViewer, now: Date) {
    return this.prisma.cardProgress.count({
      where: {
        userId: viewer.id,
        dueAt: { lte: now },
        card: { set: { deletedAt: null, ...visibleTo(viewer) } },
      },
    });
  }

  /** Trả `null` nếu người xem không xem được bộ từ. */
  async findSetProgress(setId: string, viewer: SetViewer, now: Date) {
    const set = await this.prisma.studySet.findFirst({
      where: { id: setId, deletedAt: null, ...visibleTo(viewer) },
      select: { id: true },
    });
    if (!set) {
      return null;
    }
    const progress = { userId: viewer.id, card: { setId } };
    const [total, started, mastered, due] = await Promise.all([
      this.prisma.card.count({ where: { setId } }),
      this.prisma.cardProgress.count({ where: progress }),
      this.prisma.cardProgress.count({
        where: { ...progress, interval: { gte: MASTERED_INTERVAL_DAYS } },
      }),
      this.prisma.cardProgress.count({ where: { ...progress, dueAt: { lte: now } } }),
    ]);
    return { total, started, mastered, due };
  }

  /** Trả `null` nếu người xem không xem được bộ từ. Thẻ chưa học không có tiến độ. */
  async findCardProgress(setId: string, viewer: SetViewer) {
    const set = await this.prisma.studySet.findFirst({
      where: { id: setId, deletedAt: null, ...visibleTo(viewer) },
      select: { cards: { select: { id: true }, orderBy: { position: 'asc' } } },
    });
    if (!set) {
      return null;
    }
    const progress = await this.prisma.cardProgress.findMany({
      where: { userId: viewer.id, card: { setId } },
      select: { cardId: true, interval: true, dueAt: true },
    });
    return { cardIds: set.cards.map(({ id }) => id), progress };
  }

  countAnswersSince(userId: string, since: Date) {
    return this.prisma.attempt.count({
      where: { session: { userId }, createdAt: { gte: since } },
    });
  }

  async findHardCards(viewer: SetViewer) {
    const groups = await this.prisma.attempt.groupBy({
      by: ['cardId'],
      where: {
        isCorrect: false,
        session: { userId: viewer.id },
        card: { set: { deletedAt: null, ...visibleTo(viewer) } },
      },
      _count: { _all: true },
      orderBy: [{ _count: { cardId: 'desc' } }, { cardId: 'asc' }],
      take: HARD_CARD_LIMIT,
    });
    const cards = await this.prisma.card.findMany({
      where: { id: { in: groups.map(({ cardId }) => cardId) } },
      select: { id: true, setId: true, term: true, definition: true },
    });
    const byId = new Map(cards.map((card) => [card.id, card]));

    return groups.flatMap(({ cardId, _count }) => {
      const card = byId.get(cardId);
      return card
        ? [
            {
              cardId,
              setId: card.setId,
              term: card.term,
              definition: card.definition,
              wrongCount: _count._all,
            },
          ]
        : [];
    });
  }

  /** Tổng XP từ trước tới nay và XP từ `since`. */
  async sumXp(userId: string, since: Date) {
    const [total, recent] = await Promise.all([
      this.prisma.xpEvent.aggregate({ where: { userId }, _sum: { amount: true } }),
      this.prisma.xpEvent.aggregate({
        where: { userId, createdAt: { gte: since } },
        _sum: { amount: true },
      }),
    ]);
    return { total: total._sum.amount ?? 0, since: recent._sum.amount ?? 0 };
  }

  async updateDailyGoalXp(userId: string, dailyGoalXp: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { dailyGoalXp },
      select: { id: true },
    });
  }

  async findDailyGoalXp(userId: string): Promise<number | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dailyGoalXp: true },
    });
    return user?.dailyGoalXp ?? null;
  }
}
