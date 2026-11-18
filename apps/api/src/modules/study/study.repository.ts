import { Injectable } from '@nestjs/common';
import { applyReview, createSrsState, type StudyMode, type SrsState } from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
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
  findSet(setId: string, viewer: SetViewer) {
    return this.prisma.studySet.findFirst({
      where: { id: setId, deletedAt: null, ...visibleTo(viewer) },
      select: {
        termLang: true,
        defLang: true,
        cards: {
          orderBy: { position: 'asc' },
          select: { id: true, term: true, definition: true },
        },
      },
    });
  }

  createSession(userId: string, setId: string, mode: StudyMode, total: number) {
    return this.prisma.studySession.create({
      data: { userId, setId, mode, total },
      select: SESSION_SELECT,
    });
  }

  findSession(id: string) {
    return this.prisma.studySession.findUnique({ where: { id }, select: SESSION_SELECT });
  }

  findAttempts(sessionId: string) {
    return this.prisma.attempt.findMany({
      where: { sessionId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: { cardId: true, isCorrect: true },
    });
  }

  async saveAnswers(userId: string, sessionId: string, answers: GradedAnswer[], now: Date) {
    await this.prisma.$transaction(
      async (tx) => {
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
          },
        });
        const states = new Map<string, SrsState>(
          saved.map(({ cardId, ...state }) => [cardId, state]),
        );
        for (const { cardId, isCorrect } of answers) {
          const state = states.get(cardId) ?? createSrsState(now);
          states.set(cardId, applyReview(state, isCorrect, now));
        }

        for (const [cardId, state] of states) {
          await tx.cardProgress.upsert({
            where: { userId_cardId: { userId, cardId } },
            create: { userId, cardId, ...state },
            update: state,
          });
        }
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
