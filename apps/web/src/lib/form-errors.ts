import { ERROR_CODES } from '@vocab/shared';
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

export function formErrorMessage(error: unknown): string {
  return error instanceof HttpError
    ? error.message
    : 'Không kết nối được máy chủ. Hãy kiểm tra mạng rồi thử lại.';
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
