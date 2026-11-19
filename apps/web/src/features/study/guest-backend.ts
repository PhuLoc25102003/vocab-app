import {
  ERROR_CODES,
  getMode,
  setDetailResponseSchema,
  type Question,
  type StartedSession,
  type StudySession,
} from '@vocab/shared';
import { http, HttpError } from '@/lib/http';
import type { StudyBackend } from './api';

interface GuestSession {
  session: StudySession;
  questions: Map<string, Question>;
  /** Kết quả lần trả lời đầu của mỗi thẻ, giống cách API tính điểm. */
  firstResults: Map<string, boolean>;
}

/** Khách học ngay trên trình duyệt: chấm bằng logic dùng chung và không lưu gì lên server. */
export function createGuestBackend(): StudyBackend {
  let current: GuestSession | null = null;
  let sequence = 0;

  const requireSession = (id: string): GuestSession => {
    if (current?.session.id !== id) {
      throw new Error('Phiên học thử không còn tồn tại');
    }
    return current;
  };

  return {
    async start(setId, mode, options): Promise<StartedSession> {
      const body = await http(`/sets/${encodeURIComponent(setId)}`, { skipAuth: true });
      const { cards, termLang, defLang } = setDetailResponseSchema.parse(body).data;
      if (cards.length === 0) {
        throw new HttpError('Bộ từ này chưa có thẻ', 422, ERROR_CODES.SET_HAS_NO_CARDS);
      }

      const selected = options?.cardIds ? new Set(options.cardIds) : null;
      const studyCards = selected ? cards.filter(({ id }) => selected.has(id)) : cards;
      const questions = getMode(mode).buildQuestions(studyCards, {});
      sequence += 1;
      const session: StudySession = {
        id: `guest-${sequence}`,
        setId,
        mode,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        correct: 0,
        total: questions.length,
      };
      current = {
        session,
        questions: new Map(questions.map((question) => [question.id, question])),
        firstResults: new Map(),
      };
      return { session, questions, languages: { term: termLang, definition: defLang } };
    },

    async submit(sessionId, answers) {
      const { session, questions, firstResults } = requireSession(sessionId);
      const strategy = getMode(session.mode);
      for (const answer of answers) {
        const question = questions.get(answer.questionId);
        if (question && !firstResults.has(question.cardId)) {
          firstResults.set(question.cardId, strategy.grade(question, answer).isCorrect);
        }
      }
    },

    async finish(sessionId) {
      const { session, firstResults } = requireSession(sessionId);
      const wrongCardIds = [...firstResults].filter(([, correct]) => !correct).map(([id]) => id);
      return {
        session: {
          ...session,
          finishedAt: new Date().toISOString(),
          total: firstResults.size,
          correct: firstResults.size - wrongCardIds.length,
        },
        wrongCardIds,
      };
    },
  };
}
