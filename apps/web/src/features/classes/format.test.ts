import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime } from './format';

describe('định dạng ngày giờ của lớp học', () => {
  it('ngày trước giờ sau, có năm', () => {
    const local = new Date(2026, 11, 1, 23, 59).toISOString();
    expect(formatDateTime(local)).toBe('01/12/2026 23:59');
    expect(formatDate(local)).toBe('01/12/2026');
  });
});
