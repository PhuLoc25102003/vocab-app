/**
 * Khung HTML chung cho mọi mail của Nhớ Từ, theo giao diện Liquid Glass của web: nền `--bg` có
 * quầng sáng màu chính, thẻ kính trong có viền sáng (`.glass-surface`), nút nhuộm màu chính có vệt
 * sáng (`.glass-button-tint`). Mail không đọc được CSS variable nên màu chép từ token chế độ sáng
 * ở `apps/web/src/app/globals.css`; đổi token ở web thì sửa cả bảng này. Bố cục dùng bảng, style
 * inline; gradient và bóng là lớp tô thêm, ứng dụng mail không hỗ trợ thì vẫn còn màu nền phẳng.
 */
export const MAIL_COLORS = {
  /** `--bg` */
  bg: '#f1f4f9',
  /** `--surface` (trắng 72%) */
  surface: 'rgba(255,255,255,0.72)',
  /** `--surface` trộn lên `--bg`, dùng khi ứng dụng mail bỏ qua độ trong */
  surfaceSolid: '#fafbfd',
  /** `--glass-rim` */
  glassRim: 'rgba(255,255,255,0.65)',
  /** `--glass-highlight` */
  glassHighlight: 'rgba(255,255,255,0.95)',
  /** `--glass-ring` */
  glassRing: 'rgba(15,23,42,0.10)',
  /** `--border` */
  border: 'rgba(15,23,42,0.08)',
  /** `--text` */
  text: '#0f172a',
  /** `--text-muted` */
  muted: '#475569',
  /** `--primary` */
  primary: '#2563eb',
  /** `--primary-fg` */
  primaryFg: '#ffffff',
  /** `--primary-soft` */
  primarySoft: 'rgba(37,99,235,0.10)',
  /** `--danger` */
  danger: '#dc2626',
  /** `--danger-soft` */
  dangerSoft: 'rgba(239,68,68,0.12)',
  /** `--success` */
  success: '#0f766e',
  /** `--success-soft` */
  successSoft: 'rgba(13,148,136,0.13)',
  /** `--highlight`, màu ngọn lửa chuỗi ngày trên web */
  highlight: '#fde047',
  /** `fill-highlight/30` của ngọn lửa */
  highlightSoft: 'rgba(253,224,71,0.30)',
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

/** Một việc cần làm trong mail: ô kính có biểu tượng, nội dung và con số nổi bật bên phải. */
export interface MailItem {
  /** Emoji trong ô tròn bên trái. */
  icon: string;
  title: string;
  detail: string;
  /** Con số nổi bật bên phải, ví dụ "5" ngày hoặc "3 giờ". */
  stat?: { value: string; caption: string };
  tone: 'danger' | 'streak' | 'primary' | 'success';
}

export interface MailLayoutInput {
  lang: 'vi' | 'en';
  /** Địa chỉ web, dùng cho logo `public/mail/logo.png`. */
  webOrigin: string;
  /** Dòng xem trước hiện cạnh tiêu đề trong hộp thư. */
  preheader: string;
  greeting: string;
  heading: string;
  intro?: string;
  items?: readonly MailItem[];
  cta: { label: string; href: string };
  /** Lời chào cuối, mỗi dòng cách nhau bằng ký tự xuống dòng. */
  signOff: string;
  /** HTML đã escape cho chân mail, ví dụ link huỷ nhận. */
  footerHtml: string;
}

const TONES: Record<MailItem['tone'], { soft: string; ink: string }> = {
  danger: { soft: MAIL_COLORS.dangerSoft, ink: MAIL_COLORS.danger },
  streak: { soft: MAIL_COLORS.highlightSoft, ink: MAIL_COLORS.text },
  primary: { soft: MAIL_COLORS.primarySoft, ink: MAIL_COLORS.primary },
  success: { soft: MAIL_COLORS.successSoft, ink: MAIL_COLORS.success },
};

/** Viền sáng và bóng của `.glass-surface`. */
const GLASS_SHADOW = `inset 0 1.5px 1px 0 ${MAIL_COLORS.glassHighlight}, 0 10px 30px -8px ${MAIL_COLORS.glassRing}`;

function renderItem(item: MailItem): string {
  const { soft, ink } = TONES[item.tone];
  const stat = item.stat
    ? `<td align="right" valign="middle" style="padding-left:12px;white-space:nowrap">
<p style="margin:0;font-family:${FONT};font-size:22px;font-weight:800;line-height:1.1;color:${ink}">${escapeHtml(item.stat.value)}</p>
<p style="margin:2px 0 0;font-family:${FONT};font-size:12px;color:${MAIL_COLORS.muted}">${escapeHtml(item.stat.caption)}</p>
</td>`
    : '';
  return `<tr><td style="padding:0 0 10px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${MAIL_COLORS.surfaceSolid};background:${MAIL_COLORS.surface};border:1px solid ${MAIL_COLORS.glassRim};border-radius:16px;box-shadow:inset 0 1px 0 0 ${MAIL_COLORS.glassHighlight},0 1px 2px 0 ${MAIL_COLORS.border}">
<tr>
<td width="44" valign="middle" style="padding:14px 0 14px 14px">
<div style="width:44px;height:44px;border-radius:9999px;background:${soft};font-size:22px;line-height:44px;text-align:center">${escapeHtml(item.icon)}</div>
</td>
<td valign="middle" style="padding:14px 14px 14px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td valign="middle">
<p style="margin:0;font-family:${FONT};font-size:16px;font-weight:700;line-height:1.35;color:${MAIL_COLORS.text}">${escapeHtml(item.title)}</p>
<p style="margin:3px 0 0;font-family:${FONT};font-size:14px;line-height:1.5;color:${MAIL_COLORS.muted}">${escapeHtml(item.detail)}</p>
</td>
${stat}
</tr></table>
</td>
</tr></table>
</td></tr>`;
}

/** Dựng mail HTML hoàn chỉnh: logo, thẻ kính chứa lời chào, tiêu đề, các việc, nút chính và chân mail. */
export function renderMailLayout(input: MailLayoutInput): string {
  const c = MAIL_COLORS;
  const items = (input.items ?? []).map(renderItem).join('');
  const intro = input.intro
    ? `<p style="margin:0 0 18px;font-family:${FONT};font-size:16px;line-height:1.6;color:${c.muted}">${escapeHtml(input.intro)}</p>`
    : '';
  const href = escapeHtml(input.cta.href);
  const logo = escapeHtml(`${input.webOrigin}/mail/logo.png`);
  // Quầng sáng của `body::before`: màu chính 14% ở trên, xanh ngọc 8% ở góc dưới.
  const glow =
    'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.14) 0px, rgba(37,99,235,0) 70%), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(13,148,136,0.08) 0px, rgba(13,148,136,0) 70%)';

  return `<!doctype html>
<html lang="${input.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(input.heading)}</title>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${c.bg};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${c.bg}">${escapeHtml(input.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${c.bg}" style="background-color:${c.bg};background-image:${glow}">
<tr><td align="center" style="padding:28px 12px 32px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 6px 18px">
<img src="${logo}" width="143" height="40" alt="Nhớ Từ" style="display:block;border:0;outline:none;font-family:${FONT};font-size:20px;font-weight:700;color:${c.text}">
</td></tr>
<tr><td style="background:${c.surfaceSolid};background:${c.surface};border:1px solid ${c.glassRim};border-radius:24px;box-shadow:${GLASS_SHADOW};padding:28px 22px 26px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td>
<p style="margin:0 0 6px;font-family:${FONT};font-size:15px;color:${c.muted}">${escapeHtml(input.greeting)}</p>
<h1 style="margin:0 0 12px;font-family:${FONT};font-size:24px;font-weight:800;line-height:1.3;letter-spacing:-0.01em;color:${c.text}">${escapeHtml(input.heading)}</h1>
${intro}
</td></tr>
${items}
<tr><td style="padding:14px 0 0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td align="center" bgcolor="${c.primary}" style="background-color:${c.primary};background-image:radial-gradient(120% 100% at 0% 0%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 50%);border-radius:9999px;box-shadow:inset 0 1px 0 0 rgba(255,255,255,0.35),0 8px 20px -8px rgba(37,99,235,0.55)">
<a href="${href}" style="display:block;padding:15px 24px;font-family:${FONT};font-size:16px;font-weight:700;color:${c.primaryFg};text-decoration:none;border-radius:9999px">${escapeHtml(input.cta.label)}</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:22px 2px 0">
<p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.6;color:${c.text}">${escapeHtml(input.signOff).split('\n').join('<br>')}</p>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:18px 10px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${c.muted};text-align:center">${input.footerHtml}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
