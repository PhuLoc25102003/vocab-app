/**
 * Khung HTML chung cho mọi mail của Nhớ Từ. Mail không đọc được CSS variable nên màu được chép từ
 * token ở chế độ sáng (`apps/web/src/app/globals.css`), mọi style viết inline và bố cục dùng bảng
 * để Gmail, Outlook và ứng dụng mail trên điện thoại hiển thị giống nhau. Token có độ trong
 * (`--*-soft`, `--border`) được trộn sẵn lên nền trắng vì nhiều ứng dụng mail bỏ qua `rgb(... / a)`.
 * Đổi token ở web thì sửa cả bảng này.
 */
export const MAIL_COLORS = {
  /** `--bg` */
  bg: '#f1f4f9',
  /** `--surface` trên nền trắng */
  surface: '#ffffff',
  /** `--border` trộn lên trắng */
  border: '#ecedef',
  /** `--text` */
  text: '#0f172a',
  /** `--text-muted` */
  muted: '#475569',
  /** `--primary` */
  primary: '#2563eb',
  /** `--primary-fg` */
  primaryFg: '#ffffff',
  /** `--primary-soft` trộn lên trắng */
  primarySoft: '#e9effd',
  /** `--danger-mark` */
  dangerMark: '#ef4444',
  /** `--danger-soft` trộn lên trắng */
  dangerSoft: '#fde9e9',
  /** `--success-mark` */
  successMark: '#0d9488',
  /** `--success-soft` trộn lên trắng */
  successSoft: '#e0f1f0',
  /** `--highlight`, màu ngọn lửa chuỗi ngày trên web */
  highlight: '#fde047',
  /** `--highlight` 30% trộn lên trắng, giống `fill-highlight/30` của ngọn lửa */
  highlightSoft: '#fef6c8',
} as const;

const FONT = "'Be Vietnam Pro', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface MailCard {
  /** Nhãn nhỏ phía trên, ví dụ "⏰ Bài tập". */
  label: string;
  title: string;
  detail: string;
  tone: 'danger' | 'streak' | 'primary' | 'success';
}

export interface MailLayoutInput {
  lang: 'vi' | 'en';
  /** Dòng xem trước hiện cạnh tiêu đề trong hộp thư. */
  preheader: string;
  greeting: string;
  heading: string;
  intro?: string;
  cards?: readonly MailCard[];
  cta: { label: string; href: string };
  /** Dòng nhỏ dưới nút, ví dụ hạn dùng của liên kết. */
  note?: string;
  /** Lời chào cuối, mỗi dòng cách nhau bằng ký tự xuống dòng. */
  signOff: string;
  /** HTML đã escape cho chân mail, ví dụ link huỷ nhận. */
  footerHtml: string;
}

/** Vạch màu bên trái và nền nhạt của thẻ. Chữ luôn là `--text` để đủ tương phản trên mọi nền. */
const TONES: Record<MailCard['tone'], { accent: string; soft: string }> = {
  danger: { accent: MAIL_COLORS.dangerMark, soft: MAIL_COLORS.dangerSoft },
  streak: { accent: MAIL_COLORS.highlight, soft: MAIL_COLORS.highlightSoft },
  primary: { accent: MAIL_COLORS.primary, soft: MAIL_COLORS.primarySoft },
  success: { accent: MAIL_COLORS.successMark, soft: MAIL_COLORS.successSoft },
};

function renderCard(card: MailCard): string {
  const { accent, soft } = TONES[card.tone];
  return `<tr><td style="padding:0 0 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${soft};border-left:4px solid ${accent};border-radius:12px">
<tr><td style="padding:14px 18px">
<p style="margin:0;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${MAIL_COLORS.text}">${escapeHtml(card.label)}</p>
<p style="margin:6px 0 0;font-family:${FONT};font-size:17px;font-weight:700;line-height:1.4;color:${MAIL_COLORS.text}">${escapeHtml(card.title)}</p>
<p style="margin:4px 0 0;font-family:${FONT};font-size:15px;line-height:1.55;color:${MAIL_COLORS.muted}">${escapeHtml(card.detail)}</p>
</td></tr></table>
</td></tr>`;
}

/** Dựng mail HTML hoàn chỉnh: logo, lời chào, tiêu đề, các thẻ nội dung, một nút chính và chân mail. */
export function renderMailLayout(input: MailLayoutInput): string {
  const c = MAIL_COLORS;
  const cards = (input.cards ?? []).map(renderCard).join('');
  const intro = input.intro
    ? `<p style="margin:0 0 20px;font-family:${FONT};font-size:16px;line-height:1.6;color:${c.muted}">${escapeHtml(input.intro)}</p>`
    : '';
  const note = input.note
    ? `<p style="margin:14px 0 0;font-family:${FONT};font-size:13px;line-height:1.5;color:${c.muted};text-align:center">${escapeHtml(input.note)}</p>`
    : '';
  const href = escapeHtml(input.cta.href);

  return `<!doctype html>
<html lang="${input.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(input.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${c.bg};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${c.bg}">${escapeHtml(input.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.bg}">
<tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 4px 18px">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td width="36" height="36" align="center" valign="middle" style="width:36px;height:36px;background:${c.primary};border-radius:10px;font-family:${FONT};font-size:20px;font-weight:700;line-height:36px;color:${c.primaryFg}">&#10003;</td>
<td style="padding-left:10px;font-family:${FONT};font-size:20px;font-weight:700;color:${c.text}">Nhớ Từ</td>
</tr></table>
</td></tr>
<tr><td style="background:${c.surface};border:1px solid ${c.border};border-radius:20px;padding:28px 24px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td>
<p style="margin:0 0 6px;font-family:${FONT};font-size:15px;color:${c.muted}">${escapeHtml(input.greeting)}</p>
<h1 style="margin:0 0 14px;font-family:${FONT};font-size:24px;font-weight:800;line-height:1.3;letter-spacing:-0.01em;color:${c.text}">${escapeHtml(input.heading)}</h1>
${intro}
</td></tr>
${cards}
<tr><td style="padding:12px 0 0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td align="center" style="background:${c.primary};border-radius:12px">
<a href="${href}" style="display:block;padding:15px 24px;font-family:${FONT};font-size:16px;font-weight:700;color:${c.primaryFg};text-decoration:none">${escapeHtml(input.cta.label)}</a>
</td></tr></table>
${note}
</td></tr>
<tr><td style="padding:24px 0 0">
<p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.6;color:${c.text}">${escapeHtml(input.signOff).split('\n').join('<br>')}</p>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:18px 8px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${c.muted};text-align:center">${input.footerHtml}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
