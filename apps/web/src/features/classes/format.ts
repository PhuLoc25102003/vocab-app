import type { Locale } from '@/lib/i18n/config';

const viDateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const viTimeFormat = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' });

const enDateFormat = new Intl.DateTimeFormat('en-US', {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
});
const enTimeFormat = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/** Ngày trước giờ sau, ví dụ "01/12/2026 23:59" (vi) hoặc "12/01/2026 11:59 PM" (en). */
export function formatDateTime(value: string, locale: Locale = 'vi'): string {
  const date = new Date(value);
  if (locale === 'en') {
    return `${enDateFormat.format(date)} ${enTimeFormat.format(date)}`;
  }
  return `${viDateFormat.format(date)} ${viTimeFormat.format(date)}`;
}

export function formatDate(value: string, locale: Locale = 'vi'): string {
  const date = new Date(value);
  if (locale === 'en') {
    return enDateFormat.format(date);
  }
  return viDateFormat.format(date);
}
