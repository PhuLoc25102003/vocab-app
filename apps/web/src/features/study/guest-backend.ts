import {
  ERROR_CODES,
  getMode,
  setDetailResponseSchema,
  type Question,
  type SetDetail,
  type StartedSession,
  type StudySession,
  type UserAnswer,
} from '@vocab/shared';
import { http, HttpError } from '@/lib/http';
import type { StudyBackend } from './api';

interface GuestSession {
  session: StudySession;
  questions: Map<string, Question>;
  /** Kết quả lần trả lời đầu của mỗi thẻ, giống cách API tính điểm. */
  firstResults: Map<string, boolean>;
  /** Đáp án lần đầu của mỗi thẻ, để đồng bộ khi học offline. */
  firstAnswers: Map<string, UserAnswer>;
}

type StudySource = Pick<SetDetail, 'cards' | 'termLang' | 'defLang'>;

export interface GuestBackendOptions {
  /** Nguồn bộ từ. Mặc định lấy bộ công khai từ API, học offline thì lấy từ máy. */
  loadSet?: (setId: string) => Promise<StudySource>;
  /** Gọi khi xong phiên với đáp án lần đầu của từng thẻ. */
  onFinish?: (finished: { session: StudySession; answers: UserAnswer[] }) => Promise<void> | void;
}

async function fetchPublicSet(setId: string): Promise<StudySource> {
  const body = await http(`/sets/${encodeURIComponent(setId)}`, { skipAuth: true });
  return setDetailResponseSchema.parse(body).data;
}

/** Học ngay trên trình duyệt: chấm bằng logic dùng chung và không lưu gì lên server. */
export function createGuestBackend({
  loadSet = fetchPublicSet,
  onFinish,
}: GuestBackendOptions = {}): StudyBackend {
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
      const { cards, termLang, defLang } = await loadSet(setId);
      if (cards.length === 0) {
        throw new HttpError('Bộ từ này chưa có thẻ', 422, ERROR_CODES.SET_HAS_NO_CARDS);
      }

      const selected = options?.cardIds ? new Set(options.cardIds) : null;
      const studyCards = selected ? cards.filter(({ id }) => selected.has(id)) : cards;
      const questions = getMode(mode).buildQuestions(studyCards, {});
      if (questions.length === 0) {
        throw new HttpError(
          'Bộ từ chưa có thẻ phù hợp với chế độ này',
          422,
          ERROR_CODES.NO_QUESTIONS_FOR_MODE,
        );
      }
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
        firstAnswers: new Map(),
      };
      return { session, questions, languages: { term: termLang, definition: defLang } };
    },

    async submit(sessionId, answers) {
      const { session, questions, firstResults, firstAnswers } = requireSession(sessionId);
      const strategy = getMode(session.mode);
      for (const answer of answers) {
        const question = questions.get(answer.questionId);
        if (question && !firstResults.has(question.cardId)) {
          firstResults.set(question.cardId, strategy.grade(question, answer).isCorrect);
          firstAnswers.set(question.cardId, answer);
        }
      }
    },

    async finish(sessionId) {
      const { session, firstResults, firstAnswers } = requireSession(sessionId);
      const wrongCardIds = [...firstResults].filter(([, correct]) => !correct).map(([id]) => id);
      const finished = {
        ...session,
        finishedAt: new Date().toISOString(),
        total: firstResults.size,
        correct: firstResults.size - wrongCardIds.length,
      };
      await onFinish?.({ session: finished, answers: [...firstAnswers.values()] });
      return { session: finished, wrongCardIds };
    },
  };
}
