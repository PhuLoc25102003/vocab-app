import { Injectable } from '@nestjs/common';
import type { Pagination, StudyMode } from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { toSkipTake } from '../../common/base/pagination';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/** Phần của bài giao cần để tính kết quả. */
export interface AssignmentTarget {
  setId: string;
  mode: StudyMode;
  dueAt: Date | null;
  createdAt: Date;
}

export interface FinishedSession {
  userId: string;
  setId: string;
  mode: StudyMode;
  finishedAt: Date;
  correct: number;
  total: number;
}

const HARD_CARD_LIMIT = 5;

@Injectable()
export class ClassResultsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /** Bài giao phải thuộc lớp và bộ từ chưa bị xoá. */
  findAssignment(classId: string, id: string): Promise<AssignmentTarget | null> {
    return this.prisma.assignment.findFirst({
      where: { id, classId, set: { deletedAt: null } },
      select: { setId: true, mode: true, dueAt: true, createdAt: true },
    });
  }

  isMember(classId: string, userId: string) {
    return this.prisma.classMember.count({ where: { classId, userId } }).then((count) => count > 0);
  }

  /** Học sinh hiện còn trong lớp, ai vào trước đứng trước. Học sinh đã rời lớp không còn ở đây. */
  async findMembers(classId: string, query?: Pagination) {
    const where = { classId };
    const [rows, total] = await Promise.all([
      this.prisma.classMember.findMany({
        where,
        select: { userId: true, user: { select: { displayName: true } } },
        orderBy: [{ joinedAt: 'asc' }, { userId: 'asc' }],
        ...(query ? toSkipTake(query) : {}),
      }),
      this.prisma.classMember.count({ where }),
    ]);
    return {
      items: rows.map(({ userId, user }) => ({ userId, displayName: user.displayName })),
      total,
    };
  }

  /** Phiên học xong đúng bộ và chế độ, tính từ lúc giao, của các học sinh cần xem. */
  async findFinishedSessions(
    userIds: readonly string[],
    targets: readonly AssignmentTarget[],
  ): Promise<FinishedSession[]> {
    if (!userIds.length || !targets.length) return [];
    const rows = await this.prisma.studySession.findMany({
      where: {
        userId: { in: [...userIds] },
        OR: targets.map(({ setId, mode, createdAt }) => ({
          setId,
          mode,
          finishedAt: { gte: createdAt },
        })),
      },
      select: {
        userId: true,
        setId: true,
        mode: true,
        finishedAt: true,
        correct: true,
        total: true,
      },
      orderBy: { finishedAt: 'asc' },
    });
    return rows.flatMap(({ finishedAt, ...row }) => (finishedAt ? [{ ...row, finishedAt }] : []));
  }

  /** Thẻ học sinh hiện trong lớp trả lời sai nhiều nhất ở các phiên của bài giao. */
  async findHardCards(classId: string, { setId, mode, createdAt }: AssignmentTarget) {
    const grouped = await this.prisma.attempt.groupBy({
      by: ['cardId', 'isCorrect'],
      where: {
        session: {
          setId,
          mode,
          finishedAt: { gte: createdAt },
          user: { classMembers: { some: { classId } } },
        },
      },
      _count: { _all: true },
    });
    const counts = new Map<string, { wrongCount: number; attemptCount: number }>();
    for (const { cardId, isCorrect, _count } of grouped) {
      const entry = counts.get(cardId) ?? { wrongCount: 0, attemptCount: 0 };
      entry.attemptCount += _count._all;
      if (!isCorrect) entry.wrongCount += _count._all;
      counts.set(cardId, entry);
    }
    const top = [...counts.entries()]
      .filter(([, { wrongCount }]) => wrongCount > 0)
      .sort(([idA, a], [idB, b]) => b.wrongCount - a.wrongCount || idA.localeCompare(idB))
      .slice(0, HARD_CARD_LIMIT);
    if (!top.length) return [];
    const cards = await this.prisma.card.findMany({
      where: { id: { in: top.map(([cardId]) => cardId) } },
      select: { id: true, term: true, definition: true },
    });
    const byId = new Map(cards.map((card) => [card.id, card]));
    return top.flatMap(([cardId, count]) => {
      const card = byId.get(cardId);
      return card ? [{ cardId, term: card.term, definition: card.definition, ...count }] : [];
    });
  }
}
