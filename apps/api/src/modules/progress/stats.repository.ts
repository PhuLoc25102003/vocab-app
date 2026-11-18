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

  countMastered(viewer: SetViewer) {
    return this.prisma.cardProgress.count({
      where: {
        userId: viewer.id,
        interval: { gte: MASTERED_INTERVAL_DAYS },
        card: { set: { deletedAt: null, ...visibleTo(viewer) } },
      },
    });
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
}
