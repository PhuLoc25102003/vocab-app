import { HttpStatus, Injectable } from '@nestjs/common';
import { computeStreak, ERROR_CODES, startOfStudyDay } from '@vocab/shared';
import { ok } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import type { SetViewer } from '../sets/sets.repository';
import { StatsRepository } from './stats.repository';

@Injectable()
export class StatsService {
  constructor(private readonly stats: StatsRepository) {}

  async overview(viewer: SetViewer) {
    const now = new Date();
    const [days, masteredCards, answersToday, dueCards, hardCards] = await Promise.all([
      this.stats.findStudyDays(viewer.id),
      this.stats.countMastered(viewer),
      this.stats.countAnswersSince(viewer.id, startOfStudyDay(now)),
      this.stats.countDue(viewer, now),
      this.stats.findHardCards(viewer),
    ]);
    return ok({
      streakDays: computeStreak(days, now),
      masteredCards,
      answersToday,
      dueCards,
      hardCards,
    });
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
