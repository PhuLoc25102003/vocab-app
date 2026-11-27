import { ERROR_CODES } from '@vocab/shared';
import { afterEach, describe, expect, it } from 'vitest';
import { formErrorMessage } from './form-errors';
import { HttpError } from './http';
import { createI18n } from './i18n/config';
import { resources } from './i18n/resources';

describe('formErrorMessage', () => {
  afterEach(() => {
    createI18n('vi');
  });

  it('mọi mã lỗi đều có bản dịch ở cả hai ngôn ngữ', () => {
    for (const code of Object.values(ERROR_CODES)) {
      expect(resources.vi.errors.codes, code).toHaveProperty(code);
      expect(resources.en.errors.codes, code).toHaveProperty(code);
    }
  });

  it('tiếng Việt giữ thông báo cụ thể của máy chủ, lỗi mạng dùng câu dịch', () => {
    createI18n('vi');
    const error = new HttpError('Ghép cặp cần ít nhất 2 thẻ', 422, ERROR_CODES.VALIDATION_ERROR);
    expect(formErrorMessage(error)).toBe('Ghép cặp cần ít nhất 2 thẻ');
    expect(formErrorMessage(new TypeError('Failed to fetch'))).toBe(
      'Không kết nối được máy chủ. Hãy kiểm tra mạng rồi thử lại.',
    );
  });

  it('tiếng Anh dịch theo mã, mã lạ thì dùng thông báo của máy chủ', () => {
    createI18n('en', resources);
    expect(formErrorMessage(new HttpError('Không tìm thấy lớp', 404, 'CLASS_NOT_FOUND'))).toBe(
      'Class not found.',
    );
    expect(formErrorMessage(new HttpError('Lỗi lạ', 400, 'SOMETHING_NEW'))).toBe('Lỗi lạ');
    expect(formErrorMessage(null)).toBe(
      'Could not reach the server. Check your connection and try again.',
    );
  });

  it('hỗ trợ ép locale qua tham số hoặc tự nhận diện từ document.documentElement.lang', () => {
    createI18n('vi');
    const lockedError = new HttpError(
      'Tài khoản đã bị khoá. Hãy liên hệ quản trị viên.',
      403,
      ERROR_CODES.ACCOUNT_LOCKED,
    );
    // Khi ép locale = 'en'
    expect(formErrorMessage(lockedError, 'en')).toBe(
      'This account is locked. Contact an administrator.',
    );

    // Khi document.documentElement.lang là 'en' mà getI18n không xác định
    document.documentElement.lang = 'en';
    expect(formErrorMessage(lockedError, 'en')).toBe(
      'This account is locked. Contact an administrator.',
    );
    document.documentElement.lang = 'vi';
  });
});
