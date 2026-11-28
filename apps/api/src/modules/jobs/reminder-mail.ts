import { escapeHtml, renderMailLayout, type MailCard } from '../../infrastructure/mail/mail-layout';
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

interface Copy {
  greeting: Lines<string>;
  assignment: {
    label: string;
    subject: Lines<Assignment>;
    heading: Lines<Assignment>;
    title: (title: string) => string;
    detail: Lines<{ due: string; hoursLeft: number }>;
    cta: string;
  };
  streak: {
    label: string;
    subject: Lines<Streak>;
    heading: Lines<Streak>;
    title: (days: number) => string;
    detail: Lines<Streak>;
    cta: string;
  };
  review: {
    label: string;
    subject: Lines<Review>;
    heading: Lines<Review>;
    title: (count: number) => string;
    detail: Lines<Review>;
    cta: string;
  };
  intro: string;
  signOff: Lines<void>;
  footer: string;
  unsubscribe: string;
  dateLocale: string;
}

const VI: Copy = {
  greeting: [(name) => `Chào ${name} 👋`, (name) => `${name} ơi,`, (name) => `Hey ${name},`],
  assignment: {
    label: '⏰ Bài tập',
    subject: [
      ({ setTitle }) => `⏰ "${setTitle}" sắp hết hạn rồi`,
      ({ setTitle }) => `Còn kịp nộp "${setTitle}" đấy!`,
      () => `Bài tập của bạn sắp đóng`,
    ],
    heading: [
      () => 'Bài tập sắp đóng, còn kịp đấy!',
      () => 'Nước rút thôi, bài sắp hết hạn',
      () => 'Đừng để bài tập trôi qua nhé',
    ],
    title: (title) => `"${title}"`,
    detail: [
      ({ due, hoursLeft }) => `Hết hạn ${due}, còn khoảng ${hoursLeft} giờ. Bạn chưa nộp bài này.`,
      ({ due, hoursLeft }) => `Còn chừng ${hoursLeft} giờ (đến ${due}). Làm ngay kẻo lỡ!`,
      ({ due }) => `Hạn nộp: ${due}. Vài phút là xong, làm luôn cho nhẹ đầu.`,
    ],
    cta: 'Làm bài ngay',
  },
  streak: {
    label: '🔥 Chuỗi ngày học',
    subject: [
      ({ streakDays }) => `🔥 Chuỗi ${streakDays} ngày sắp tắt lửa`,
      ({ streakDays }) => `Giữ lửa ${streakDays} ngày giúp mình nhé!`,
      ({ streakDays }) => `${streakDays} ngày liền rồi, đừng dừng ở hôm nay`,
    ],
    heading: [
      ({ streakDays }) => `Đừng để chuỗi ${streakDays} ngày tắt lửa!`,
      ({ streakDays }) => `${streakDays} ngày liên tiếp, quá đỉnh! Thêm hôm nay nữa nhé`,
      () => 'Ngọn lửa của bạn đang chờ củi',
    ],
    title: (days) => `${days} ngày liên tiếp`,
    detail: [
      ({ count }) =>
        count > 0
          ? `Hôm nay bạn chưa học. Ôn ${count} thẻ đang chờ là chuỗi được giữ nguyên.`
          : 'Hôm nay bạn chưa học. Chỉ cần một phiên ngắn là chuỗi được giữ nguyên.',
      () => 'Năm phút trước khi ngủ là đủ giữ chuỗi. Học đều mỗi ngày, từ vựng tự vào đầu.',
      () => 'Qua nửa đêm mà chưa học thì chuỗi về 0. Học một chút thôi là an toàn.',
    ],
    cta: 'Giữ chuỗi ngay',
  },
  review: {
    label: '🧠 Ôn tập',
    subject: [
      ({ count }) => `${count} thẻ đang chờ bạn ôn`,
      ({ count }) => `🧠 ${count} từ sắp trôi khỏi trí nhớ`,
      () => 'Đến giờ ôn rồi, vào chơi chút nhé',
    ],
    heading: [
      () => 'Đúng lúc để ôn rồi đấy',
      () => 'Ôn bây giờ, nhớ lâu hơn hẳn',
      () => 'Vài phút ôn, cả tuần không quên',
    ],
    title: (count) => `${count} thẻ đến hạn`,
    detail: [
      () => 'Đây là lúc bạn sắp quên. Ôn đúng lúc này giúp từ ở lại lâu hơn nhiều.',
      () => 'Chỉ mất vài phút. Lướt qua một lượt là xong phần hôm nay.',
      () => 'Ôn ngay hôm nay để từ vựng không trôi mất nhé.',
    ],
    cta: 'Ôn ngay',
  },
  intro: 'Có vài việc nhỏ đang chờ bạn hôm nay:',
  signOff: [
    () => 'Học vui nhé!\nNhớ Từ',
    () => 'Cố lên, bạn làm được!\nNhớ Từ',
    () => 'Hẹn gặp bạn trong app!\nNhớ Từ',
  ],
  footer: 'Bạn nhận mail này vì đang bật nhắc học qua email.',
  unsubscribe: 'Huỷ nhận mail nhắc học',
  dateLocale: 'vi-VN',
};

const EN: Copy = {
  greeting: [(name) => `Hi ${name} 👋`, (name) => `Hey ${name},`, (name) => `Hello ${name},`],
  assignment: {
    label: '⏰ Assignment',
    subject: [
      ({ setTitle }) => `⏰ "${setTitle}" is due soon`,
      ({ setTitle }) => `There's still time to finish "${setTitle}"`,
      () => 'Your assignment is about to close',
    ],
    heading: [
      () => "It's almost due, you still have time!",
      () => 'Final stretch: your assignment closes soon',
      () => "Don't let this one slip away",
    ],
    title: (title) => `"${title}"`,
    detail: [
      ({ due, hoursLeft }) =>
        `Due ${due}, about ${hoursLeft} hours left. You haven't submitted yet.`,
      ({ due, hoursLeft }) => `About ${hoursLeft} hours to go (until ${due}). Jump in now!`,
      ({ due }) => `Due ${due}. It only takes a few minutes.`,
    ],
    cta: 'Do it now',
  },
  streak: {
    label: '🔥 Study streak',
    subject: [
      ({ streakDays }) => `🔥 Your ${streakDays}-day streak is at risk`,
      ({ streakDays }) => `Keep your ${streakDays}-day fire burning!`,
      ({ streakDays }) => `${streakDays} days in a row. Don't stop today`,
    ],
    heading: [
      ({ streakDays }) => `Don't let your ${streakDays}-day streak go out!`,
      ({ streakDays }) => `${streakDays} days straight, amazing! Make it one more`,
      () => 'Your flame needs a little fuel',
    ],
    title: (days) => `${days} days in a row`,
    detail: [
      ({ count }) =>
        count > 0
          ? `You haven't studied today. Review the ${count} waiting cards to keep it going.`
          : "You haven't studied today. One short session keeps your streak alive.",
      () => 'Five minutes before bed is all it takes. A little every day goes a long way.',
      () => 'Past midnight without studying and it resets to 0. A quick session keeps it safe.',
    ],
    cta: 'Keep my streak',
  },
  review: {
    label: '🧠 Review',
    subject: [
      ({ count }) => `${count} cards are waiting for you`,
      ({ count }) => `🧠 ${count} words are about to slip away`,
      () => 'Review time! Come say hi',
    ],
    heading: [
      () => "It's the perfect time to review",
      () => 'Review now, remember for longer',
      () => 'A few minutes now saves a week of forgetting',
    ],
    title: (count) => `${count} cards due`,
    detail: [
      () => "This is right when you'd start forgetting. Reviewing now makes words stick.",
      () => 'It only takes a few minutes. One quick pass and today is done.',
      () => "Review today so these words don't slip away.",
    ],
    cta: 'Review now',
  },
  intro: 'A few small things are waiting for you today:',
  signOff: [
    () => 'Have fun learning!\nNhớ Từ',
    () => 'You got this!\nNhớ Từ',
    () => 'See you in the app!\nNhớ Từ',
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
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  const cards: MailCard[] = input.items.map((item) => {
    if (item.kind === 'assignment') {
      const hoursLeft = Math.max(1, Math.round((item.dueAt.getTime() - now.getTime()) / HOUR_MS));
      return {
        tone: 'danger',
        label: copy.assignment.label,
        title: copy.assignment.title(item.setTitle),
        detail: pick(copy.assignment.detail, variant, { due: due.format(item.dueAt), hoursLeft }),
      };
    }
    if (item.kind === 'streak') {
      return {
        tone: 'streak',
        label: copy.streak.label,
        title: copy.streak.title(item.streakDays),
        detail: pick(copy.streak.detail, variant, item),
      };
    }
    return {
      tone: 'primary',
      label: copy.review.label,
      title: copy.review.title(item.count),
      detail: pick(copy.review.detail, variant, item),
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

  const text = [
    greeting,
    '',
    lead.heading,
    '',
    ...cards.map((card) => `- ${card.title}: ${card.detail}`),
    '',
    `${lead.cta}: ${appLink}`,
    '',
    signOff,
    '',
    `${copy.footer} ${copy.unsubscribe}: ${unsubscribeLink}`,
  ].join('\n');

  const html = renderMailLayout({
    lang: input.locale,
    preheader: cards.map((card) => `${card.title}: ${card.detail}`).join(' · '),
    greeting,
    heading: lead.heading,
    intro: cards.length > 1 ? copy.intro : undefined,
    cards,
    cta: { label: lead.cta, href: appLink },
    signOff,
    footerHtml: `${escapeHtml(copy.footer)}<br><a href="${escapeHtml(unsubscribeLink)}" style="color:inherit;text-decoration:underline">${escapeHtml(copy.unsubscribe)}</a>`,
  });
  return { to: input.to, subject: lead.subject, text, html };
}
