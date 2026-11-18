import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ERROR_CODES,
  getMode,
  isModeAvailable,
  type Pagination,
  type StartSessionDto,
  type SubmitAnswersDto,
} from '@vocab/shared';
import { ok, paginated } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import type { SetViewer } from '../sets/sets.repository';
import { StudyRepository, type GradedAnswer } from './study.repository';

function setNotFound(): AppError {
  return new AppError(ERROR_CODES.SET_NOT_FOUND, 'Không tìm thấy bộ từ', HttpStatus.NOT_FOUND);
}

function sessionNotFound(): AppError {
  return new AppError(ERROR_CODES.NOT_FOUND, 'Không tìm thấy phiên học', HttpStatus.NOT_FOUND);
}

/** Điểm tính theo lần trả lời đầu của mỗi thẻ, nên gửi lại một lô không làm đổi điểm. */
function summarize(attempts: { cardId: string; isCorrect: boolean }[]) {
  const firstResults = new Map<string, boolean>();
  for (const { cardId, isCorrect } of attempts) {
    if (!firstResults.has(cardId)) {
      firstResults.set(cardId, isCorrect);
    }
  }
  const wrongCardIds = [...firstResults].filter(([, correct]) => !correct).map(([id]) => id);
  return {
    total: firstResults.size,
    correct: firstResults.size - wrongCardIds.length,
    wrongCardIds,
  };
}

@Injectable()
export class StudyService {
  constructor(private readonly study: StudyRepository) {}

  async start(viewer: SetViewer, { setId, mode, limit, dueOnly }: StartSessionDto) {
    if (!isModeAvailable(mode)) {
      throw new AppError(
        ERROR_CODES.STUDY_MODE_UNAVAILABLE,
        'Chế độ học này chưa có',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const set = await this.study.findSet(setId, viewer, dueOnly ? new Date() : undefined);
    if (!set) {
      throw setNotFound();
    }
    if (dueOnly && set.cards.length === 0) {
      throw new AppError(
        ERROR_CODES.NO_CARDS_DUE,
        'Bộ từ này không còn thẻ đến hạn',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    if (set.cards.length === 0) {
      throw new AppError(
        ERROR_CODES.SET_HAS_NO_CARDS,
        'Bộ từ này chưa có thẻ',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const questions = getMode(mode).buildQuestions(set.cards, { limit });
    const session = await this.study.createSession(viewer.id, setId, mode, questions.length);
    const languages = { term: set.termLang, definition: set.defLang };
    return ok({ session, questions, languages });
  }

  async listDueSets(viewer: SetViewer, query: Pagination) {
    const [sets, total, dueCards] = await this.study.findDueSets(viewer, query, new Date());
    const items = sets.map(({ id, title, _count }) => ({
      setId: id,
      title,
      dueCount: _count.cards,
    }));
    return { ...paginated(items, total, query), summary: { dueCards } };
  }

  async submitAnswers(id: string, viewer: SetViewer, { answers }: SubmitAnswersDto) {
    const session = await this.study.findSession(id);
    if (!session) {
      throw sessionNotFound();
    }
    if (session.finishedAt) {
      throw new AppError(
        ERROR_CODES.STUDY_SESSION_FINISHED,
        'Phiên học đã kết thúc',
        HttpStatus.CONFLICT,
      );
    }
    const set = await this.study.findSet(session.setId, viewer);
    if (!set) {
      throw setNotFound();
    }

    const strategy = getMode(session.mode);
    const questions = new Map(strategy.buildQuestions(set.cards, {}).map((q) => [q.id, q]));
    const graded: GradedAnswer[] = [];
    const results = [];
    // Thẻ có thể bị xoá khi đang học. Bỏ qua để lô đáp án còn lại vẫn được lưu.
    for (const answer of answers) {
      const question = questions.get(answer.questionId);
      if (question) {
        const result = strategy.grade(question, answer);
        results.push({ questionId: question.id, ...result });
        graded.push({
          cardId: question.cardId,
          answer: answer.value,
          isCorrect: result.isCorrect,
          timeMs: answer.timeMs,
        });
      }
    }

    if (graded.length > 0) {
      await this.study.saveAnswers(viewer.id, id, graded, new Date());
    }
    return ok({ results, ignored: answers.length - graded.length });
  }

  async finish(id: string) {
    const { correct, total, wrongCardIds } = summarize(await this.study.findAttempts(id));
    const session = await this.study.finishSession(id, correct, total, new Date());
    if (!session) {
      throw sessionNotFound();
    }
    return ok({ session, wrongCardIds });
  }
}
