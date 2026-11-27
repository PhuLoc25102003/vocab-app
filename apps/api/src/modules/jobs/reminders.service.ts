import { Injectable } from '@nestjs/common';
import { startOfStudyDay, toStudyDay } from '@vocab/shared';
import { ok } from '../../common/base/pagination';
import type { NewNotification } from '../notifications/notifications.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { StreakService } from '../progress/streak.service';
import { RemindersRepository } from './reminders.repository';

const DAY_MS = 86_400_000;
/** Chuỗi từ bao nhiêu ngày thì nhắc giữ chuỗi. */
export const STREAK_REMINDER_MIN_DAYS = 3;
/** Từ bao nhiêu thẻ đến hạn thì nhắc ôn. */
export const REVIEW_REMINDER_MIN_CARDS = 10;
/** Nhắc bài tập hết hạn trong khoảng này. */
const ASSIGNMENT_WINDOW_MS = DAY_MS;

export type Reminder = { userId: string } & NewNotification;

/**
 * Job nhắc học chạy lúc 20:00 giờ Việt Nam (GitHub Actions gọi). Chọn người cần nhắc, ghi
 * `ReminderLog` để chạy lại không trùng, rồi tạo thông báo trong chuông.
 */
@Injectable()
export class RemindersService {
  constructor(
    private readonly reminders: RemindersRepository,
    private readonly streak: StreakService,
    private readonly notifications: NotificationsService,
  ) {}

  async runDaily(now = new Date()) {
    const [daily, assignments] = await Promise.all([
      this.pickDaily(now),
      this.pickAssignments(now),
    ]);
    await this.reminders.logReminders([
      ...daily.map(({ userId }) => ({ userId, kind: 'DAILY' as const, key: toStudyDay(now) })),
      ...assignments.map(({ userId, key }) => ({ userId, kind: 'ASSIGNMENT_DUE' as const, key })),
    ]);
    await this.notifications.notifyEach([
      ...daily,
      ...assignments.map(({ key: _key, ...reminder }) => reminder),
    ]);
    return ok({ daily: daily.length, assignments: assignments.length });
  }

  /** Chuỗi từ 3 ngày mà hôm nay chưa học, hoặc có từ 10 thẻ đến hạn. Mỗi người một nhắc. */
  private async pickDaily(now: Date): Promise<Reminder[]> {
    const todayStart = startOfStudyDay(now);
    const candidates = await this.reminders.findDailyCandidates(
      toStudyDay(now),
      new Date(todayStart.getTime() - DAY_MS),
      todayStart,
      now,
    );
    const picked: Reminder[] = [];
    for (const { id, studiedYesterday, dueCards } of candidates) {
      const streakDays = studiedYesterday ? await this.streak.currentStreak(id, now) : 0;
      const keepStreak = streakDays >= STREAK_REMINDER_MIN_DAYS;
      if (!keepStreak && dueCards < REVIEW_REMINDER_MIN_CARDS) continue;
      picked.push({
        userId: id,
        type: 'REVIEW_DUE',
        data: { count: dueCards, streakDays: keepStreak ? streakDays : 0 },
        href: '/review',
      });
    }
    return picked;
  }

  private async pickAssignments(now: Date) {
    const rows = await this.reminders.findDueAssignments(
      now,
      new Date(now.getTime() + ASSIGNMENT_WINDOW_MS),
    );
    return rows.map(({ assignmentId, userId, setTitle, dueAt }) => ({
      userId,
      key: assignmentId,
      type: 'ASSIGNMENT_DUE' as const,
      data: { setTitle, dueAt: dueAt.toISOString() },
      href: `/classes/assignments/${assignmentId}`,
    }));
  }
}
