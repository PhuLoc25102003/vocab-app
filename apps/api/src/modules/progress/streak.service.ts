import { Injectable } from '@nestjs/common';
import { freezableDay, grantStreakFreezes, startOfStudyDay } from '@vocab/shared';
import { NotificationsService } from '../notifications/notifications.service';
import { StreakRepository } from './streak.repository';

const DAY_MS = 86_400_000;

export interface StreakState {
  /** Số thẻ giữ chuỗi còn lại sau khi cấp và dùng. */
  held: number;
  /** Mọi ngày đã dùng thẻ, mới nhất trước. */
  frozenDays: string[];
}

/**
 * Cấp thẻ giữ chuỗi mỗi thứ Hai và tự dùng thẻ khi người học bỏ lỡ đúng hôm qua.
 * Không có job hẹn giờ vì Render gói Free ngủ khi rảnh: việc này chạy mỗi khi người học mở
 * Tổng quan hoặc gửi đáp án.
 */
@Injectable()
export class StreakService {
  constructor(
    private readonly streak: StreakRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async refresh(userId: string, now = new Date()): Promise<StreakState> {
    const state = await this.streak.findFreezeState(userId);
    if (!state) {
      return { held: 0, frozenDays: [] };
    }
    let held = state.streakFreezes;
    const granted = grantStreakFreezes(held, state.streakFreezeWeek, now);
    if (granted.week !== state.streakFreezeWeek || granted.held !== held) {
      const saved = await this.streak.saveGrant(
        userId,
        state.streakFreezeWeek,
        granted.held,
        granted.week,
      );
      if (saved) {
        held = granted.held;
      } else {
        // Một request khác vừa cấp trước, đọc lại số thẻ thật.
        held = (await this.streak.findFreezeState(userId))?.streakFreezes ?? held;
      }
    }

    const [studied, frozenDays] = await Promise.all([
      this.streak.findStudyDaysSince(userId, new Date(startOfStudyDay(now).getTime() - 2 * DAY_MS)),
      this.streak.findFrozenDays(userId),
    ]);
    const day = held > 0 ? freezableDay(studied, frozenDays, now) : null;
    if (day && (await this.streak.useFreeze(userId, day))) {
      await this.notifications.notify([userId], {
        type: 'STREAK_FROZEN',
        data: { day },
        href: '/dashboard',
      });
      return { held: held - 1, frozenDays: [day, ...frozenDays] };
    }
    return { held, frozenDays };
  }
}
