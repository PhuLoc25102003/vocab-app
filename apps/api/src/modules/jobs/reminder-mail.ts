import { escapeHtml, renderMailLayout, type MailItem } from '../../infrastructure/mail/mail-layout';
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
  /** Chọn cách nói trong các mẫu câu; cùng người cùng ngày thì cùng mẫu. Mặc định 0. */
  variant?: number;
  /** Mốc tính "còn mấy giờ" cho bài tập. Mặc định là lúc gửi. */
  now?: Date;
}

type Assignment = Extract<ReminderItem, { kind: 'assignment' }>;
type Streak = Extract<ReminderItem, { kind: 'streak' }>;
type Review = Extract<ReminderItem, { kind: 'review' }>;
/** Mỗi phần có vài cách nói, chọn theo `variant` để mail mỗi ngày đọc khác nhau. */
type Lines<T> = readonly ((value: T) => string)[];

interface Part<T, D> {
  subject: Lines<T>;
  heading: Lines<T>;
  detail: Lines<D>;
  cta: string;
}

interface Copy {
  greeting: Lines<string>;
  assignment: Part<Assignment, { due: string }> & {
    title: (setTitle: string) => string;
    stat: (hours: number) => { value: string; caption: string };
  };
  streak: Part<Streak, Streak> & { title: string; caption: string };
  review: Part<Review, Review> & { title: string; caption: string };
  intro: string;
  signOff: Lines<void>;
  footer: string;
  unsubscribe: string;
  dateLocale: string;
}

const VI: Copy = {
  greeting: [(name) => `Chào ${name} 👋`, (name) => `${name} ơi,`, (name) => `Hi ${name},`],
  assignment: {
    subject: [
      ({ setTitle }) => `⏰ "${setTitle}" sắp hết hạn`,
      ({ setTitle }) => `Bạn chưa nộp "${setTitle}"`,
      () => 'Bài tập sắp đóng, vào làm nhé',
    ],
    heading: [
      () => 'Bài tập sắp hết hạn rồi',
      () => 'Còn kịp nộp bài đấy',
      () => 'Làm nốt bài trước khi đóng nhé',
    ],
    title: (setTitle) => setTitle,
    detail: [
      ({ due }) => `Hạn nộp ${due}. Bạn chưa nộp bài này.`,
      ({ due }) => `Đóng lúc ${due}. Làm một lượt là xong.`,
      ({ due }) => `Hạn ${due}. Nộp sớm cho nhẹ đầu.`,
    ],
    stat: (hours) => ({ value: `${hours} giờ`, caption: 'còn lại' }),
    cta: 'Làm bài ngay',
  },
  streak: {
    subject: [
      ({ streakDays }) => `🔥 Giữ chuỗi ${streakDays} ngày nhé`,
      ({ streakDays }) => `Chuỗi ${streakDays} ngày đang chờ bạn hôm nay`,
      ({ streakDays }) => `${streakDays} ngày liền rồi, thêm hôm nay nữa nhé`,
    ],
    heading: [
      ({ streakDays }) => `Đừng để chuỗi ${streakDays} ngày đứt`,
      ({ streakDays }) => `${streakDays} ngày liên tiếp, giữ tiếp nhé`,
      () => 'Hôm nay bạn chưa học',
    ],
    title: 'Chuỗi ngày học',
    detail: [
      ({ count }) =>
        count > 0
          ? `Hôm nay chưa học. Ôn ${count} thẻ đang chờ là giữ được chuỗi.`
          : 'Hôm nay chưa học. Một phiên ngắn là giữ được chuỗi.',
      () => 'Qua 0 giờ mà chưa học thì chuỗi về 0.',
      () => 'Vài phút trước khi ngủ là đủ giữ chuỗi.',
    ],
    caption: 'ngày',
    cta: 'Giữ chuỗi',
  },
  review: {
    subject: [
      ({ count }) => `${count} thẻ đang chờ bạn ôn`,
      ({ count }) => `Đến lúc ôn ${count} thẻ rồi`,
      () => 'Ôn vài phút cho nhớ lâu nhé',
    ],
    heading: [
      () => 'Đến lúc ôn rồi',
      () => 'Ôn bây giờ là nhớ lâu nhất',
      () => 'Vài phút ôn cho hôm nay',
    ],
    title: 'Thẻ đến hạn ôn',
    detail: [
      () => 'Ôn đúng lúc sắp quên giúp từ ở lại lâu hơn.',
      () => 'Lướt một lượt là xong phần hôm nay.',
      () => 'Ôn hôm nay để không phải học lại từ đầu.',
    ],
    caption: 'thẻ',
    cta: 'Ôn ngay',
  },
  intro: 'Hôm nay có mấy việc đang chờ bạn:',
  signOff: [
    () => 'Học vui nhé!\nNhớ Từ',
    () => 'Hẹn gặp bạn trong app.\nNhớ Từ',
    () => 'Cố lên nhé!\nNhớ Từ',
  ],
  footer: 'Bạn nhận mail này vì đang bật nhắc học qua email.',
  unsubscribe: 'Huỷ nhận mail nhắc học',
  dateLocale: 'vi-VN',
};

const EN: Copy = {
  greeting: [(name) => `Hi ${name} 👋`, (name) => `Hey ${name},`, (name) => `Hello ${name},`],
  assignment: {
    subject: [
      ({ setTitle }) => `⏰ "${setTitle}" is due soon`,
      ({ setTitle }) => `You haven't submitted "${setTitle}"`,
      () => 'Your assignment closes soon',
    ],
    heading: [
      () => 'Your assignment is due soon',
      () => 'There is still time to submit',
      () => 'Finish it before it closes',
    ],
    title: (setTitle) => setTitle,
    detail: [
      ({ due }) => `Due ${due}. You haven't submitted yet.`,
      ({ due }) => `Closes ${due}. One run and you're done.`,
      ({ due }) => `Due ${due}. Get it off your plate early.`,
    ],
    stat: (hours) => ({ value: `${hours}h`, caption: 'left' }),
    cta: 'Do it now',
  },
  streak: {
    subject: [
      ({ streakDays }) => `🔥 Keep your ${streakDays}-day streak`,
      ({ streakDays }) => `Your ${streakDays}-day streak is waiting`,
      ({ streakDays }) => `${streakDays} days in a row. Make it one more`,
    ],
    heading: [
      ({ streakDays }) => `Don't break your ${streakDays}-day streak`,
      ({ streakDays }) => `${streakDays} days in a row, keep going`,
      () => "You haven't studied today",
    ],
    title: 'Study streak',
    detail: [
      ({ count }) =>
        count > 0
          ? `No study yet today. Review the ${count} waiting cards to keep it.`
          : 'No study yet today. One short session keeps it.',
      () => 'Miss midnight and it resets to 0.',
      () => 'A few minutes before bed is enough.',
    ],
    caption: 'days',
    cta: 'Keep my streak',
  },
  review: {
    subject: [
      ({ count }) => `${count} cards are waiting for you`,
      ({ count }) => `Time to review ${count} cards`,
      () => 'A few minutes of review today',
    ],
    heading: [
      () => 'Time to review',
      () => 'Review now, remember longer',
      () => 'A few minutes for today',
    ],
    title: 'Cards due',
    detail: [
      () => 'Reviewing right before you forget makes words stick.',
      () => 'One quick pass and today is done.',
      () => "Review today so you don't relearn from scratch.",
    ],
    caption: 'cards',
    cta: 'Review now',
  },
  intro: 'A few things are waiting for you today:',
  signOff: [
    () => 'Have fun learning!\nNhớ Từ',
    () => 'See you in the app.\nNhớ Từ',
    () => 'You got this!\nNhớ Từ',
  ],
  footer: "You're getting this because email reminders are on.",
  unsubscribe: 'Unsubscribe from reminder emails',
  dateLocale: 'en-GB',
};

const COPY = { vi: VI, en: EN } as const;
const HOUR_MS = 3_600_000;

function pick<T>(lines: Lines<T>, variant: number, value: T): string {
  const index = ((variant % lines.length) + lines.length) % lines.length;
  return lines[index]!(value);
}

/** Một mail gộp mọi nhắc của người đó trong ngày; nhắc đầu tiên quyết định tiêu đề và nút chính. */
export function buildReminderMail(input: ReminderMailInput): MailMessage {
  const copy = COPY[input.locale];
  const variant = input.variant ?? 0;
  const now = input.now ?? new Date();
  const due = new Intl.DateTimeFormat(copy.dateLocale, {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  const items: MailItem[] = input.items.map((item) => {
    if (item.kind === 'assignment') {
      const hours = Math.max(1, Math.round((item.dueAt.getTime() - now.getTime()) / HOUR_MS));
      return {
        tone: 'danger',
        icon: '⏰',
        title: copy.assignment.title(item.setTitle),
        detail: pick(copy.assignment.detail, variant, { due: due.format(item.dueAt) }),
        stat: copy.assignment.stat(hours),
      };
    }
    if (item.kind === 'streak') {
      return {
        tone: 'streak',
        icon: '🔥',
        title: copy.streak.title,
        detail: pick(copy.streak.detail, variant, item),
        stat: { value: String(item.streakDays), caption: copy.streak.caption },
      };
    }
    return {
      tone: 'primary',
      icon: '🧠',
      title: copy.review.title,
      detail: pick(copy.review.detail, variant, item),
      stat: { value: String(item.count), caption: copy.review.caption },
    };
  });

  const first = input.items[0] ?? { kind: 'review', count: 0 };
  const lead =
    first.kind === 'assignment'
      ? {
          subject: pick(copy.assignment.subject, variant, first),
          heading: pick(copy.assignment.heading, variant, first),
          cta: copy.assignment.cta,
        }
      : first.kind === 'streak'
        ? {
            subject: pick(copy.streak.subject, variant, first),
            heading: pick(copy.streak.heading, variant, first),
            cta: copy.streak.cta,
          }
        : {
            subject: pick(copy.review.subject, variant, first),
            heading: pick(copy.review.heading, variant, first),
            cta: copy.review.cta,
          };
  const appLink = `${input.webOrigin}/${first.kind === 'assignment' ? 'classes' : 'review'}`;
  const unsubscribeLink = `${input.webOrigin}/unsubscribe?token=${encodeURIComponent(input.unsubscribeToken)}`;
  const greeting = pick(copy.greeting, variant, input.displayName);
  const signOff = pick(copy.signOff, variant, undefined);
  const summary = items.map(
    ({ title, detail, stat }) =>
      `${title}${stat ? ` (${stat.value} ${stat.caption})` : ''}: ${detail}`,
  );

  const text = [
    greeting,
    '',
    lead.heading,
    '',
    ...summary.map((line) => `- ${line}`),
    '',
    `${lead.cta}: ${appLink}`,
    '',
    signOff,
    '',
    `${copy.footer} ${copy.unsubscribe}: ${unsubscribeLink}`,
  ].join('\n');

  const html = renderMailLayout({
    lang: input.locale,
    webOrigin: input.webOrigin,
    preheader: summary.join(' · '),
    greeting,
    heading: lead.heading,
    intro: items.length > 1 ? copy.intro : undefined,
    items,
    cta: { label: lead.cta, href: appLink },
    signOff,
    footerHtml: `${escapeHtml(copy.footer)}<br><a href="${escapeHtml(unsubscribeLink)}" style="color:inherit;text-decoration:underline">${escapeHtml(copy.unsubscribe)}</a>`,
  });
  return { to: input.to, subject: lead.subject, text, html };
}
