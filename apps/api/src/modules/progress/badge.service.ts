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

  /**
   * Danh sách huy hiệu kèm tiến độ. Huy hiệu đã đủ điều kiện mà chưa lưu (ví dụ học đêm nhưng
   * không bấm kết thúc phiên nên `award` chưa chạy) được cấp luôn ở đây để luôn sáng đúng.
   */
  async list(userId: string) {
    const now = new Date();
    const [metrics, owned] = await Promise.all([
      this.metrics(userId, now),
      this.badges.findBadges(userId),
    ]);
    const earnedAt = new Map(owned.map(({ code, earnedAt }) => [code, earnedAt]));
    const missing = earnedBadges(metrics).filter((code) => !earnedAt.has(code));
    if (missing.length > 0) {
      await this.grant(userId, missing, now);
      for (const code of missing) earnedAt.set(code, now);
    }
    return ok(
      BADGES.map((badge) => ({
        code: badge.code,
        progress: Math.min(metrics[badge.metric], badge.target),
        target: badge.target,
        hard: 'hard' in badge && badge.hard,
        earnedAt: earnedAt.get(badge.code) ?? null,
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
      await this.grant(userId, fresh, now);
    }
    return fresh;
  }

  /** Lưu huy hiệu mới và báo trong chuông, mỗi huy hiệu một thông báo. */
  private async grant(userId: string, codes: readonly BadgeCode[], now: Date) {
    await this.badges.addBadges(userId, codes, now);
    for (const code of codes) {
      await this.notifications.notify([userId], {
        type: 'BADGE_EARNED',
        data: { code },
        href: '/account#badges-title',
      });
    }
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
