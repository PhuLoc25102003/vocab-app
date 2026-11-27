import { ERROR_CODES } from '@vocab/shared';
import { getI18n } from 'react-i18next';
import { DEFAULT_LOCALE, type Locale, toLocale } from './i18n/config';
import { errorMessages } from './i18n/error-messages';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { HttpError } from './http';

interface FieldIssue {
  path: string;
  message: string;
}

function isFieldIssues(details: unknown): details is FieldIssue[] {
  return (
    Array.isArray(details) &&
    details.every((item: Partial<FieldIssue> | null) => typeof item?.path === 'string')
  );
}

/** Xác định locale hiện hành: ưu tiên tham số truyền vào -> getI18n() -> DOM lang -> cookie -> mặc định */
export function resolveCurrentLocale(forcedLocale?: Locale): Locale {
  if (forcedLocale) return toLocale(forcedLocale);
  const fromI18n = getI18n()?.language;
  if (fromI18n) return toLocale(fromI18n);
  if (typeof document !== 'undefined') {
    if (document.documentElement.lang) {
      return toLocale(document.documentElement.lang);
    }
    const match = document.cookie.match(/(?:^|; )vocab\.locale=([^;]+)/);
    if (match && match[1]) return toLocale(match[1]);
  }
  return DEFAULT_LOCALE;
}

/**
 * Thông báo lỗi theo ngôn ngữ đang dùng (việc 6.2a). Tiếng Việt giữ thông báo của máy chủ vì API
 * trả tiếng Việt và thường cụ thể hơn câu chung của mã; ngôn ngữ khác dịch theo `error.code`,
 * mã chưa có bản dịch thì dùng thông báo của máy chủ. Lỗi mạng luôn dịch.
 */
export function formErrorMessage(error: unknown, forcedLocale?: Locale): string {
  const locale = resolveCurrentLocale(forcedLocale);
  const errors = errorMessages[locale];
  if (!(error instanceof HttpError)) return errors.network;
  const codes: Partial<Record<string, string>> = errors.codes;
  if (locale === DEFAULT_LOCALE && error.message) return error.message;
  return codes[error.code] ?? (error.message || errors.network);
}

/** Thông báo khi chỉ có mã lỗi, ví dụ mã trên URL sau khi API chuyển hướng về web. */
export function errorCodeMessage(code: string, forcedLocale?: Locale): string {
  const locale = resolveCurrentLocale(forcedLocale);
  const errors = errorMessages[locale];
  const codes: Partial<Record<string, string>> = errors.codes;
  return codes[code] ?? codes[ERROR_CODES.INTERNAL_ERROR] ?? errors.network;
}

/** Gắn lỗi validate vào từng ô. Lỗi còn lại trả về để hiện ở đầu form. */
export function applyFormError<T extends FieldValues>(
  error: unknown,
  fields: readonly Path<T>[],
  setError: UseFormSetError<T>,
  forcedLocale?: Locale,
): string | null {
  if (
    error instanceof HttpError &&
    error.code === ERROR_CODES.VALIDATION_ERROR &&
    isFieldIssues(error.details)
  ) {
    const known = error.details.filter(({ path }) => fields.includes(path as Path<T>));
    known.forEach(({ path, message }) => setError(path as Path<T>, { message }));
    if (known.length > 0) {
      return null;
    }
  }
  return formErrorMessage(error, forcedLocale);
}
