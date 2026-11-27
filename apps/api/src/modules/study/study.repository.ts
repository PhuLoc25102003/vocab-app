import { Injectable } from '@nestjs/common';
import {
  applyReview,
  createSrsState,
  scoreAnswers,
  startOfStudyDay,
  trailingCombo,
  XP_RULES,
  type Pagination,
  type StudyMode,
  type SrsState,
  type XpAnswer,
} from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { toSkipTake } from '../../common/base/pagination';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { visibleTo, type SetViewer } from '../sets/sets.repository';

const SESSION_SELECT = {
  id: true,
  setId: true,
  mode: true,
  startedAt: true,
  finishedAt: true,
  correct: true,
  total: true,
} as const;

/** Một lô có thể ghi tới 200 thẻ, lâu hơn mức mặc định 5 giây của transaction. */
const SAVE_ANSWERS_TIMEOUT_MS = 30_000;

const dueCardWhere = (userId: string, now: Date) => ({
  progress: { some: { userId, dueAt: { lte: now } } },
});

export interface GradedAnswer {
  cardId: string;
  answer: string;
  isCorrect: boolean;
  timeMs: number;
}

@Injectable()
export class StudyRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /** Trả `null` nếu bộ từ không tồn tại hoặc người xem không có quyền. */
  /** `dueAt` có giá trị thì chỉ lấy các thẻ đã đến hạn của người xem tại thời điểm đó. */
  findSet(setId: string, viewer: SetViewer, dueAt?: Date) {
    return this.prisma.studySet.findFirst({
      where: { id: setId, deletedAt: null, ...visibleTo(viewer) },
      select: {
        termLang: true,
        defLang: true,
        cards: {
          where: dueAt ? dueCardWhere(viewer.id, dueAt) : undefined,
          orderBy: { position: 'asc' },
          select: { id: true, term: true, definition: true, example: true, imageUrl: true },
        },
      },
    });
  }

  /** Tiến độ của người học với các thẻ, dùng để tính mức nhớ khi tạo câu hỏi. */
  findProgress(userId: string, cardIds: string[]) {
    return this.prisma.cardProgress.findMany({
      where: { userId, cardId: { in: cardIds } },
      select: { cardId: true, reps: true, lastResult: true },
    });
  }

  findDueSets(viewer: SetViewer, query: Pagination, now: Date) {
    const dueCard = dueCardWhere(viewer.id, now);
    const visibleSet = { deletedAt: null, ...visibleTo(viewer) };
    const where = { ...visibleSet, cards: { some: dueCard } };
    return Promise.all([
      this.prisma.studySet.findMany({
        where,
        ...toSkipTake(query),
        orderBy: { title: 'asc' },
        select: {
          id: true,
          title: true,
          _count: { select: { cards: { where: dueCard } } },
        },
      }),
      this.prisma.studySet.count({ where }),
      this.prisma.card.count({ where: { ...dueCard, set: visibleSet } }),
    ]);
  }

  /** Lần đến hạn sớm nhất sau `now` của thẻ người xem còn xem được. */
  async findNextDue(viewer: SetViewer, now: Date): Promise<Date | null> {
    const next = await this.prisma.cardProgress.findFirst({
      where: {
        userId: viewer.id,
        dueAt: { gt: now },
        card: { set: { deletedAt: null, ...visibleTo(viewer) } },
      },
      orderBy: { dueAt: 'asc' },
      select: { dueAt: true },
    });
    return next?.dueAt ?? null;
  }

  createSession(
    userId: string,
    setId: string,
    mode: StudyMode,
    total: number,
    assignmentId?: string,
  ) {
    return this.prisma.studySession.create({
      data: { userId, setId, mode, total, assignmentId: assignmentId ?? null },
      select: SESSION_SELECT,
    });
  }

  /** Bài giao mà người này đang là thành viên lớp (lớp chưa lưu trữ). */
  findAssignmentForMember(id: string, userId: string) {
    return this.prisma.assignment.findFirst({
      where: { id, class: { archivedAt: null, members: { some: { userId } } } },
      select: { setId: true, mode: true, modes: true },
    });
  }

  findSession(id: string) {
    return this.prisma.studySession.findUnique({ where: { id }, select: SESSION_SELECT });
  }

  findAttemptKeys(sessionId: string) {
    return this.prisma.attempt.findMany({
      where: { sessionId },
      select: { cardId: true, answer: true, timeMs: true },
    });
  }

  findAttempts(sessionId: string) {
    return this.prisma.attempt.findMany({
      where: { sessionId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: { cardId: true, isCorrect: true },
    });
  }

  /** Lưu đáp án, cập nhật lịch ôn và cộng XP trong cùng một transaction. Trả về XP được cộng. */
  async saveAnswers(
    userId: string,
    sessionId: string,
    answers: GradedAnswer[],
    now: Date,
  ): Promise<number> {
    return this.prisma.$transaction(
      async (tx) => {
        const [previous, earned] = await Promise.all([
          tx.attempt.findMany({
            where: { sessionId },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: XP_RULES.comboSize,
            select: { isCorrect: true },
          }),
          tx.xpEvent.aggregate({
            where: { userId, createdAt: { gte: startOfStudyDay(now) } },
            _sum: { amount: true },
          }),
        ]);

        await tx.attempt.createMany({
          // Lệch từng mili giây để giữ đúng thứ tự trả lời trong cùng một lô.
          data: answers.map((answer, index) => ({
            ...answer,
            sessionId,
            createdAt: new Date(now.getTime() + index),
          })),
        });

        const cardIds = [...new Set(answers.map(({ cardId }) => cardId))];
        const saved = await tx.cardProgress.findMany({
          where: { userId, cardId: { in: cardIds } },
          select: {
            cardId: true,
            ease: true,
            interval: true,
            reps: true,
            lapses: true,
            dueAt: true,
            lastResult: true,
            updatedAt: true,
          },
        });
        const states = new Map<string, SrsState>(
          saved.map(({ cardId, updatedAt: _updatedAt, ...state }) => [cardId, state]),
        );
        /** Lần trả lời đúng gần nhất của từng thẻ, để không cộng XP lặp lại trong 10 phút. */
        const lastCorrectAt = new Map<string, number>(
          saved
            .filter(({ lastResult }) => lastResult === true)
            .map(({ cardId, updatedAt }) => [cardId, updatedAt.getTime()]),
        );
        const xpAnswers: XpAnswer[] = [];
        for (const { cardId, isCorrect } of answers) {
          const known = states.get(cardId);
          const lastCorrect = lastCorrectAt.get(cardId);
          xpAnswers.push({
            isCorrect,
            wasDue: known !== undefined && known.reps > 0 && known.dueAt <= now,
            recentlyCorrect:
              lastCorrect !== undefined && now.getTime() - lastCorrect < XP_RULES.repeatWindowMs,
          });
          if (isCorrect) {
            lastCorrectAt.set(cardId, now.getTime());
          }
          states.set(cardId, applyReview(known ?? createSrsState(now), isCorrect, now));
        }

        for (const [cardId, state] of states) {
          await tx.cardProgress.upsert({
            where: { userId_cardId: { userId, cardId } },
            create: { userId, cardId, ...state },
            update: state,
          });
        }

        const { xp } = scoreAnswers(xpAnswers, {
          comboBefore: trailingCombo(previous.map(({ isCorrect }) => isCorrect).reverse()),
          earnedToday: earned._sum.amount ?? 0,
        });
        if (xp > 0) {
          await tx.xpEvent.create({
            data: { userId, sessionId, amount: xp, source: 'ANSWERS', createdAt: now },
          });
        }
        return xp;
      },
      { timeout: SAVE_ANSWERS_TIMEOUT_MS },
    );
  }

  /** Chỉ phiên chưa kết thúc mới được ghi điểm, gọi lại không đổi kết quả cũ. */
  async finishSession(id: string, correct: number, total: number, now: Date) {
    await this.prisma.studySession.updateMany({
      where: { id, finishedAt: null },
      data: { finishedAt: now, correct, total },
    });
    return this.findSession(id);
  }
}
