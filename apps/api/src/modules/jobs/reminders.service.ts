import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { notificationPrefsSchema, startOfStudyDay, toStudyDay } from '@vocab/shared';
import { ok } from '../../common/base/pagination';
import { resolveWebOrigin, type Env } from '../../config/env';
import { Mailer } from '../../infrastructure/mail/mailer';
import type { NewNotification } from '../notifications/notifications.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { createUnsubscribeToken } from '../notifications/unsubscribe-token';
import { StreakService } from '../progress/streak.service';
import { buildReminderMail, type ReminderItem } from './reminder-mail';
import { RemindersRepository } from './reminders.repository';

const DAY_MS = 86_400_000;
/** Chuỗi từ bao nhiêu ngày thì nhắc giữ chuỗi. */
export const STREAK_REMINDER_MIN_DAYS = 3;
/** Từ bao nhiêu thẻ đến hạn thì nhắc ôn. */
export const REVIEW_REMINDER_MIN_CARDS = 10;
/** Nhắc bài tập hết hạn trong khoảng này. */
const ASSIGNMENT_WINDOW_MS = DAY_MS;
/** Mail chừa lại mỗi ngày cho quên mật khẩu. */
export const MAIL_RESERVED_FOR_AUTH = 50;

export type Reminder = { userId: string } & NewNotification;

/**
 * Job nhắc học chạy lúc 20:00 giờ Việt Nam (GitHub Actions gọi). Chọn người cần nhắc, ghi
 * `ReminderLog` để chạy lại không trùng, rồi tạo thông báo trong chuông.
 */
@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly reminders: RemindersRepository,
    private readonly streak: StreakService,
    private readonly notifications: NotificationsService,
    private readonly mailer: Mailer,
    private readonly config: ConfigService<Env, true>,
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
    const emails = await this.mailReminders(daily, assignments, now);
    return ok({ daily: daily.length, assignments: assignments.length, emails });
  }

  /**
   * Mỗi người tối đa một mail gộp các nhắc. Nhắc chuỗi và ôn chỉ gửi mail khi người đó không nhận
   * Web Push; bài tập sắp hết hạn luôn gửi. Hết hạn mức Brevo thì bỏ người ưu tiên thấp: có bài
   * tập trước, rồi chuỗi, rồi thẻ đến hạn.
   */
  private async mailReminders(
    daily: readonly Reminder[],
    assignments: readonly (Reminder & { key: string })[],
    now: Date,
  ): Promise<number> {
    const items = new Map<string, ReminderItem[]>();
    const add = (userId: string, item: ReminderItem) =>
      items.set(userId, [...(items.get(userId) ?? []), item]);
    for (const { userId, data } of assignments) {
      add(userId, {
        kind: 'assignment',
        setTitle: String(data.setTitle ?? ''),
        dueAt: new Date(String(data.dueAt)),
      });
    }
    for (const { userId, data } of daily) {
      const count = Number(data.count) || 0;
      const streakDays = Number(data.streakDays) || 0;
      add(
        userId,
        streakDays > 0 ? { kind: 'streak', streakDays, count } : { kind: 'review', count },
      );
    }
    if (items.size === 0) return 0;

    const limit = this.config.get('MAIL_DAILY_LIMIT', { infer: true });
    let budget =
      limit -
      MAIL_RESERVED_FOR_AUTH -
      (await this.reminders.countEmailsSince(startOfStudyDay(now)));
    const rank = (list: readonly ReminderItem[]) =>
      list.some(({ kind }) => kind === 'assignment')
        ? 0
        : list.some(({ kind }) => kind === 'streak')
          ? 1
          : 2;
    const targets = (await this.reminders.findMailTargets([...items.keys()])).sort(
      (a, b) => rank(items.get(a.id) ?? []) - rank(items.get(b.id) ?? []),
    );
    const secret = this.config.get('JWT_REFRESH_SECRET', { infer: true });
    const webOrigin = resolveWebOrigin(
      this.config.get('WEB_ORIGIN', { infer: true }),
      this.config.get('CORS_ORIGINS', { infer: true }),
    );

    let sent = 0;
    for (const target of targets) {
      if (budget <= 0) break;
      const prefs = notificationPrefsSchema
        .catch(notificationPrefsSchema.parse({}))
        .parse(target.notificationPrefs ?? {});
      const hasPush = target._count.pushSubscriptions > 0 && prefs.reviewPush;
      const wanted = (items.get(target.id) ?? []).filter((item) =>
        item.kind === 'assignment' ? prefs.assignmentEmail : prefs.reviewEmail && !hasPush,
      );
      if (wanted.length === 0) continue;
      try {
        await this.mailer.send(
          buildReminderMail({
            to: target.email,
            displayName: target.displayName,
            locale: target.locale === 'en' ? 'en' : 'vi',
            items: wanted,
            webOrigin,
            unsubscribeToken: createUnsubscribeToken(target.id, secret),
          }),
        );
        await this.reminders.logEmail(target.id);
        budget -= 1;
        sent += 1;
      } catch (error) {
        this.logger.error('Không gửi được mail nhắc học', error);
      }
    }
    return sent;
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
