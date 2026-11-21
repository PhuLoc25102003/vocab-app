import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime } from './format';

describe('định dạng ngày giờ của lớp học', () => {
  it('ngày trước giờ sau, có năm ở tiếng Việt', () => {
    const local = new Date(2026, 11, 1, 23, 59).toISOString();
    expect(formatDateTime(local)).toBe('01/12/2026 23:59');
    expect(formatDate(local)).toBe('01/12/2026');
  });

  it('tháng trước ngày sau ở tiếng Anh', () => {
    const local = new Date(2026, 11, 1, 23, 59).toISOString();
    expect(formatDateTime(local, 'en')).toBe('12/01/2026 11:59 PM');
    expect(formatDate(local, 'en')).toBe('12/01/2026');
  });
});
