import { Injectable } from '@nestjs/common';
import { computeStreak, startOfStudyDay } from '@vocab/shared';
import { ok } from '../../common/base/pagination';
import type { SetViewer } from '../sets/sets.repository';
import { StatsRepository } from './stats.repository';

@Injectable()
export class StatsService {
  constructor(private readonly stats: StatsRepository) {}

  async overview(viewer: SetViewer) {
    const now = new Date();
    const [days, masteredCards, answersToday, hardCards] = await Promise.all([
      this.stats.findStudyDays(viewer.id),
      this.stats.countMastered(viewer),
      this.stats.countAnswersSince(viewer.id, startOfStudyDay(now)),
      this.stats.findHardCards(viewer),
    ]);
    return ok({ streakDays: computeStreak(days, now), masteredCards, answersToday, hardCards });
  }
}
