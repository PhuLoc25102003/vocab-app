import { ERROR_CODES } from '@vocab/shared';
import { getI18n } from 'react-i18next';
import { DEFAULT_LOCALE, resources, toLocale } from './i18n/config';
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

/**
 * Thông báo lỗi theo ngôn ngữ đang dùng (việc 6.2a). Tiếng Việt giữ thông báo của máy chủ vì API
 * trả tiếng Việt và thường cụ thể hơn câu chung của mã; ngôn ngữ khác dịch theo `error.code`,
 * mã chưa có bản dịch thì dùng thông báo của máy chủ. Lỗi mạng luôn dịch.
 */
export function formErrorMessage(error: unknown): string {
  const locale = toLocale(getI18n()?.language);
  const errors = resources[locale].errors;
  if (!(error instanceof HttpError)) return errors.network;
  if (locale === DEFAULT_LOCALE) return error.message;
  const codes: Partial<Record<string, string>> = errors.codes;
  return codes[error.code] ?? error.message;
}

/** Gắn lỗi validate vào từng ô. Lỗi còn lại trả về để hiện ở đầu form. */
export function applyFormError<T extends FieldValues>(
  error: unknown,
  fields: readonly Path<T>[],
  setError: UseFormSetError<T>,
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
  return formErrorMessage(error);
}
