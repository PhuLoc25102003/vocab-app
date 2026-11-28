import { describe, expect, it } from 'vitest';
import { MAIL_COLORS } from '../src/infrastructure/mail/mail-layout';
import { buildReminderMail, type ReminderMailInput } from '../src/modules/jobs/reminder-mail';
import { mailVariant } from '../src/modules/jobs/reminders.service';

const now = new Date('2026-11-28T13:00:00.000Z');
const base: ReminderMailInput = {
  to: 'hs@example.com',
  displayName: 'Lan <b>',
  locale: 'vi',
  items: [
    { kind: 'assignment', setTitle: 'Unit 5', dueAt: new Date(now.getTime() + 3 * 3_600_000) },
    { kind: 'streak', streakDays: 5, count: 12 },
  ],
  webOrigin: 'https://nho-tu.example',
  unsubscribeToken: 'abc.def',
  now,
};

describe('buildReminderMail', () => {
  it('dựng mail có khung thương hiệu, một thẻ cho mỗi nhắc và nút theo nhắc đầu tiên', () => {
    const mail = buildReminderMail(base);
    expect(mail.subject).toContain('Unit 5');
    expect(mail.html).toContain(MAIL_COLORS.primary);
    expect(mail.html).toContain('Làm bài ngay');
    expect(mail.html).toContain('href="https://nho-tu.example/classes"');
    expect(mail.html).toContain('Chuỗi ngày học');
    expect(mail.html).toContain('3 giờ');
    expect(mail.html).toContain('src="https://nho-tu.example/mail/logo.png"');
    expect(mail.html).toContain('unsubscribe?token=abc.def');
    // Tên người dùng được escape.
    expect(mail.html).toContain('Lan &lt;b&gt;');
    expect(mail.html).not.toContain('Lan <b>');
    expect(mail.text).toContain('https://nho-tu.example/classes');
  });

  it('đổi cách nói theo variant, cùng variant thì cùng nội dung', () => {
    const review: ReminderMailInput = { ...base, items: [{ kind: 'review', count: 10 }] };
    const subjects = new Set(
      [0, 1, 2].map((variant) => buildReminderMail({ ...review, variant }).subject),
    );
    expect(subjects.size).toBe(3);
    expect(buildReminderMail({ ...review, variant: 4 }).subject).toBe(
      buildReminderMail({ ...review, variant: 4 }).subject,
    );
    expect(buildReminderMail({ ...review, variant: 0 }).html).toContain('Ôn ngay');
  });

  it('viết bằng tiếng Anh khi người dùng chọn en', () => {
    const mail = buildReminderMail({
      ...base,
      locale: 'en',
      items: [{ kind: 'review', count: 10 }],
    });
    expect(mail.html).toContain('lang="en"');
    expect(mail.html).toContain('Cards due');
    expect(mail.html).toContain('Review now');
  });
});

describe('mailVariant', () => {
  it('cố định trong một ngày học và đổi sang ngày khác', () => {
    const later = new Date(now.getTime() + 2 * 3_600_000);
    const nextDay = new Date(now.getTime() + 24 * 3_600_000);
    expect(mailVariant('user-1', now)).toBe(mailVariant('user-1', later));
    const days = new Set(
      Array.from(
        { length: 6 },
        (_, i) => mailVariant('user-1', new Date(nextDay.getTime() + i * 24 * 3_600_000)) % 3,
      ),
    );
    expect(days.size).toBeGreaterThan(1);
  });
});
