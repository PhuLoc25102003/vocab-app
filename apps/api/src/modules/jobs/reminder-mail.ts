import type { MailMessage } from '../../infrastructure/mail/mailer';

export type ReminderItem =
  | { kind: 'assignment'; setTitle: string; dueAt: Date }
  | { kind: 'streak'; streakDays: number; count: number }
  | { kind: 'review'; count: number };

export interface ReminderMailInput {
  to: string;
  displayName: string;
  locale: 'vi' | 'en';
  items: readonly ReminderItem[];
  /** Địa chỉ web, ví dụ https://nho-tu.vercel.app */
  webOrigin: string;
  unsubscribeToken: string;
}

const COPY = {
  vi: {
    hello: (name: string) => `Chào ${name},`,
    subjectAssignment: 'Bài tập sắp hết hạn',
    subjectStreak: (days: number) => `🔥 Chuỗi ${days} ngày sắp mất`,
    subjectReview: (count: number) => `${count} thẻ đang chờ bạn ôn`,
    assignment: (title: string, due: string) => `Bài "${title}" hết hạn lúc ${due}, bạn chưa nộp.`,
    streak: (days: number, count: number) =>
      count > 0
        ? `Chuỗi ${days} ngày của bạn sẽ mất nếu hôm nay không học. Còn ${count} thẻ cần ôn.`
        : `Chuỗi ${days} ngày của bạn sẽ mất nếu hôm nay không học. Học một phiên ngắn là giữ được.`,
    review: (count: number) => `Bạn có ${count} thẻ đến hạn ôn. Ôn ngay để không quên.`,
    cta: 'Mở Nhớ Từ',
    footer: 'Bạn nhận mail này vì đang bật nhắc học. Không muốn nhận nữa?',
    unsubscribe: 'Huỷ nhận mail nhắc học',
    dateLocale: 'vi-VN',
  },
  en: {
    hello: (name: string) => `Hi ${name},`,
    subjectAssignment: 'Assignment due soon',
    subjectStreak: (days: number) => `🔥 Your ${days}-day streak is at risk`,
    subjectReview: (count: number) => `${count} cards are waiting for you`,
    assignment: (title: string, due: string) =>
      `"${title}" is due at ${due} and you haven't submitted.`,
    streak: (days: number, count: number) =>
      count > 0
        ? `Your ${days}-day streak ends if you don't study today. ${count} cards are due.`
        : `Your ${days}-day streak ends if you don't study today. One short session keeps it.`,
    review: (count: number) => `You have ${count} cards due for review.`,
    cta: 'Open Nhớ Từ',
    footer: "You're getting this because reminders are on. Don't want them?",
    unsubscribe: 'Unsubscribe from reminder emails',
    dateLocale: 'en-GB',
  },
} as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Một mail gộp mọi nhắc của người đó trong ngày. */
export function buildReminderMail(input: ReminderMailInput): MailMessage {
  const copy = COPY[input.locale];
  const due = new Intl.DateTimeFormat(copy.dateLocale, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
  const lines = input.items.map((item) => {
    if (item.kind === 'assignment') return copy.assignment(item.setTitle, due.format(item.dueAt));
    if (item.kind === 'streak') return copy.streak(item.streakDays, item.count);
    return copy.review(item.count);
  });
  const first = input.items[0];
  const subject = !first
    ? copy.cta
    : first.kind === 'assignment'
      ? copy.subjectAssignment
      : first.kind === 'streak'
        ? copy.subjectStreak(first.streakDays)
        : copy.subjectReview(first.count);
  const appLink = `${input.webOrigin}/${first?.kind === 'assignment' ? 'classes' : 'review'}`;
  const unsubscribeLink = `${input.webOrigin}/unsubscribe?token=${encodeURIComponent(input.unsubscribeToken)}`;

  const text = [
    copy.hello(input.displayName),
    '',
    ...lines.map((line) => `- ${line}`),
    '',
    `${copy.cta}: ${appLink}`,
    '',
    `${copy.footer} ${copy.unsubscribe}: ${unsubscribeLink}`,
  ].join('\n');
  const html = `<p>${escapeHtml(copy.hello(input.displayName))}</p>
<ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
<p><a href="${escapeHtml(appLink)}">${escapeHtml(copy.cta)}</a></p>
<p style="font-size:12px;color:#666">${escapeHtml(copy.footer)} <a href="${escapeHtml(unsubscribeLink)}">${escapeHtml(copy.unsubscribe)}</a></p>`;
  return { to: input.to, subject, text, html };
}
