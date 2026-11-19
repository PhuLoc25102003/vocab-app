import { HttpStatus, Injectable } from '@nestjs/common';
import {
  cardMastery,
  computeStreak,
  ERROR_CODES,
  startOfStudyDay,
  toStudyDay,
} from '@vocab/shared';
import { ok } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import type { SetViewer } from '../sets/sets.repository';
import { StatsRepository } from './stats.repository';

/** Số ngày của biểu đồ hoạt động, tính cả hôm nay. */
const ACTIVITY_DAYS = 7;
const DAY_MS = 86_400_000;

@Injectable()
export class StatsService {
  constructor(private readonly stats: StatsRepository) {}

  async overview(viewer: SetViewer) {
    const now = new Date();
    const today = startOfStudyDay(now);
    const weekStart = new Date(today.getTime() - (ACTIVITY_DAYS - 1) * DAY_MS);
    const [days, masteredCards, learningCards, byDay, answersToday, dueCards, hardCards] =
      await Promise.all([
        this.stats.findStudyDays(viewer.id),
        this.stats.countMastered(viewer),
        this.stats.countLearning(viewer),
        this.stats.countAnswersByDay(viewer.id, weekStart),
        this.stats.countAnswersSince(viewer.id, startOfStudyDay(now)),
        this.stats.countDue(viewer, now),
        this.stats.findHardCards(viewer),
      ]);
    return ok({
      streakDays: computeStreak(days, now),
      masteredCards,
      learningCards,
      activity: Array.from({ length: ACTIVITY_DAYS }, (_, index) => {
        const day = toStudyDay(new Date(weekStart.getTime() + index * DAY_MS));
        return { day, answers: byDay.get(day) ?? 0 };
      }),
      answersToday,
      dueCards,
      hardCards,
    });
  }

  async cardProgress(setId: string, viewer: SetViewer) {
    const found = await this.stats.findCardProgress(setId, viewer);
    if (!found) {
      throw new AppError(ERROR_CODES.SET_NOT_FOUND, 'Không tìm thấy bộ từ', HttpStatus.NOT_FOUND);
    }
    const byCard = new Map(found.progress.map((item) => [item.cardId, item]));
    return ok(
      found.cardIds.map((cardId) => {
        const item = byCard.get(cardId) ?? null;
        return { cardId, level: cardMastery(item), dueAt: item?.dueAt ?? null };
      }),
    );
  }

  async setProgress(setId: string, viewer: SetViewer) {
    const progress = await this.stats.findSetProgress(setId, viewer, new Date());
    if (!progress) {
      throw new AppError(ERROR_CODES.SET_NOT_FOUND, 'Không tìm thấy bộ từ', HttpStatus.NOT_FOUND);
    }
    const { total, started, mastered, due } = progress;
    return ok({
      total,
      mastered,
      learning: started - mastered,
      notStarted: total - started,
      due,
    });
  }
}
