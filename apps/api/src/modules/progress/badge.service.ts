import { Injectable } from '@nestjs/common';
import {
  BADGES,
  computeStreak,
  earnedBadges,
  type BadgeCode,
  type BadgeMetrics,
} from '@vocab/shared';
import { ok } from '../../common/base/pagination';
import { NotificationsService } from '../notifications/notifications.service';
import { BadgeRepository } from './badge.repository';
import { StatsRepository } from './stats.repository';
import { StreakRepository } from './streak.repository';

@Injectable()
export class BadgeService {
  constructor(
    private readonly badges: BadgeRepository,
    private readonly stats: StatsRepository,
    private readonly streak: StreakRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async list(userId: string) {
    const [metrics, owned] = await Promise.all([
      this.metrics(userId, new Date()),
      this.badges.findBadges(userId),
    ]);
    const earnedAt = new Map(owned.map(({ code, earnedAt }) => [code, earnedAt]));
    return ok(
      BADGES.map(({ code, metric, target }) => ({
        code,
        progress: Math.min(metrics[metric], target),
        target,
        earnedAt: earnedAt.get(code) ?? null,
      })),
    );
  }

  /** Xét huy hiệu sau một phiên, trả mã các huy hiệu vừa nhận. */
  async award(userId: string, now = new Date()): Promise<BadgeCode[]> {
    const [metrics, owned] = await Promise.all([
      this.metrics(userId, now),
      this.badges.findBadges(userId),
    ]);
    const has = new Set(owned.map(({ code }) => code));
    const fresh = earnedBadges(metrics).filter((code) => !has.has(code));
    if (fresh.length > 0) {
      await this.badges.addBadges(userId, fresh, now);
      for (const code of fresh) {
        await this.notifications.notify([userId], {
          type: 'BADGE_EARNED',
          data: { code },
          href: '/account#badges-title',
        });
      }
    }
    return fresh;
  }

  private async metrics(userId: string, now: Date): Promise<BadgeMetrics> {
    const [masteredCards, activity, days, frozen] = await Promise.all([
      this.badges.countMastered(userId),
      this.badges.countActivity(userId),
      this.stats.findStudyDays(userId),
      this.streak.findFrozenDays(userId),
    ]);
    return { masteredCards, streakDays: computeStreak(days, now, frozen), ...activity };
  }
}
