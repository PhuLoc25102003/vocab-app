import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ERROR_CODES,
  getMode,
  learnLevel,
  isModeAvailable,
  type Pagination,
  type StartSessionDto,
  type SubmitAnswersDto,
} from '@vocab/shared';
import { ok, paginated } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import type { SetViewer } from '../sets/sets.repository';
import { BadgeService } from '../progress/badge.service';
import { StreakService } from '../progress/streak.service';
import { StudyRepository, type GradedAnswer } from './study.repository';

function setNotFound(): AppError {
  return new AppError(ERROR_CODES.SET_NOT_FOUND, 'Không tìm thấy bộ từ', HttpStatus.NOT_FOUND);
}

function sessionNotFound(): AppError {
  return new AppError(ERROR_CODES.NOT_FOUND, 'Không tìm thấy phiên học', HttpStatus.NOT_FOUND);
}

/** Điểm tính theo lần trả lời đầu của mỗi thẻ, nên gửi lại một lô không làm đổi điểm. */
function attemptKey({
  cardId,
  answer,
  timeMs,
}: {
  cardId: string;
  answer: string;
  timeMs: number;
}): string {
  return JSON.stringify([cardId, answer, timeMs]);
}

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
  constructor(
    private readonly study: StudyRepository,
    private readonly streak: StreakService,
    private readonly badges: BadgeService,
  ) {}

  async start(
    viewer: SetViewer,
    { setId, mode, limit, dueOnly, cardIds, assignmentId }: StartSessionDto,
  ) {
    if (!isModeAvailable(mode)) {
      throw new AppError(
        ERROR_CODES.STUDY_MODE_UNAVAILABLE,
        'Chế độ học này chưa có',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    if (assignmentId) {
      const assignment = await this.study.findAssignmentForMember(assignmentId, viewer.id);
      if (!assignment) {
        throw new AppError(
          ERROR_CODES.ASSIGNMENT_NOT_FOUND,
          'Không tìm thấy bài giao',
          HttpStatus.NOT_FOUND,
        );
      }
      const modes = assignment.modes.length ? assignment.modes : [assignment.mode];
      if (assignment.setId !== setId || !modes.includes(mode)) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'Chế độ hoặc bộ từ không thuộc bài giao này',
          HttpStatus.UNPROCESSABLE_ENTITY,
          [{ path: 'mode', code: 'not_in_assignment', message: 'Chế độ không thuộc bài giao' }],
        );
      }
    }
    const set = await this.study.findSet(setId, viewer, dueOnly ? new Date() : undefined);
    if (!set) {
      throw setNotFound();
    }
    const selected = cardIds ? new Set(cardIds) : null;
    const cards = selected ? set.cards.filter(({ id }) => selected.has(id)) : set.cards;
    if (dueOnly && cards.length === 0) {
      throw new AppError(
        ERROR_CODES.NO_CARDS_DUE,
        'Bộ từ này không còn thẻ đến hạn',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    if (cards.length === 0) {
      throw new AppError(
        ERROR_CODES.SET_HAS_NO_CARDS,
        'Bộ từ này chưa có thẻ',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const progress = await this.study.findProgress(
      viewer.id,
      cards.map(({ id }) => id),
    );
    const byCard = new Map(progress.map((item) => [item.cardId, item]));
    const leveled = cards.map((card) => ({
      ...card,
      level: learnLevel(byCard.get(card.id) ?? null),
    }));
    const questions = getMode(mode).buildQuestions(leveled, { limit });
    if (questions.length === 0) {
      throw new AppError(
        ERROR_CODES.NO_QUESTIONS_FOR_MODE,
        'Bộ từ chưa có thẻ phù hợp với chế độ này',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const session = await this.study.createSession(
      viewer.id,
      setId,
      mode,
      questions.length,
      assignmentId,
    );
    const languages = { term: set.termLang, definition: set.defLang };
    return ok({ session, questions, languages });
  }

  async listDueSets(viewer: SetViewer, query: Pagination) {
    const now = new Date();
    const [[sets, total, dueCards], nextDueAt] = await Promise.all([
      this.study.findDueSets(viewer, query, now),
      this.study.findNextDue(viewer, now),
    ]);
    const items = sets.map(({ id, title, _count }) => ({
      setId: id,
      title,
      dueCount: _count.cards,
    }));
    return { ...paginated(items, total, query), summary: { dueCards, nextDueAt } };
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

    // Trình duyệt có thể gửi lại một lô khi tải lại trang, lịch ôn không được tính hai lần.
    const seen = new Set((await this.study.findAttemptKeys(id)).map(attemptKey));
    const fresh = graded.filter((attempt) => {
      const key = attemptKey(attempt);
      const isNew = !seen.has(key);
      seen.add(key);
      return isNew;
    });

    const now = new Date();
    const xpEarned = fresh.length > 0 ? await this.study.saveAnswers(viewer.id, id, fresh, now) : 0;
    if (fresh.length > 0) {
      // Học hôm nay mà bỏ lỡ hôm qua thì dùng thẻ giữ chuỗi ngay, không chờ mở Tổng quan.
      await this.streak.refresh(viewer.id, now);
    }
    return ok({ results, ignored: answers.length - graded.length, xpEarned });
  }

  async finish(id: string, userId: string) {
    const { correct, total, wrongCardIds } = summarize(await this.study.findAttempts(id));
    const session = await this.study.finishSession(id, correct, total, new Date());
    if (!session) {
      throw sessionNotFound();
    }
    const [xpEarned, newBadges] = await Promise.all([
      this.study.sumSessionXp(id),
      this.badges.award(userId),
    ]);
    return ok({ session, wrongCardIds, xpEarned, newBadges });
  }
}
