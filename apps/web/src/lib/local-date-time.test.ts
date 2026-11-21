import { describe, expect, it } from 'vitest';
import {
  addDays,
  formatDay,
  fromLocalValue,
  monthGrid,
  parseDay,
  parseTime,
  toLocalValue,
} from './local-date-time';

describe('local-date-time', () => {
  it('đọc ngày kiểu Việt Nam và từ chối ngày không có thật', () => {
    expect(parseDay('21/11/2026')).toEqual({ year: 2026, month: 10, day: 21 });
    expect(parseDay('1-2-2027')).toEqual({ year: 2027, month: 1, day: 1 });
    expect(parseDay('31/02/2026')).toBeNull();
    expect(parseDay('11/21/2026')).toBeNull();
    expect(parseDay('2026-11-21')).toBeNull();
  });

  it('đọc giờ 24 tiếng ở nhiều cách gõ', () => {
    expect(parseTime('23:59')).toBe('23:59');
    expect(parseTime('7:05')).toBe('07:05');
    expect(parseTime('2130')).toBe('21:30');
    expect(parseTime('9')).toBe('09:00');
    expect(parseTime('24:00')).toBeNull();
    expect(parseTime('10:75')).toBeNull();
  });

  it('đổi qua lại với giá trị datetime-local', () => {
    const day = { year: 2026, month: 0, day: 5 };
    expect(toLocalValue(day, '08:00')).toBe('2026-01-05T08:00');
    expect(fromLocalValue('2026-01-05T08:00')).toEqual({ day, time: '08:00' });
    expect(fromLocalValue('')).toBeNull();
    expect(formatDay(day)).toBe('05/01/2026');
  });

  it('cộng ngày qua tháng và năm', () => {
    expect(addDays({ year: 2026, month: 11, day: 30 }, 7)).toEqual({
      year: 2027,
      month: 0,
      day: 6,
    });
  });

  it('lưới tháng bắt đầu từ thứ Hai', () => {
    // 01/11/2026 là Chủ nhật: 6 ô trống trước ngày 1.
    const cells = monthGrid(2026, 10);
    expect(cells.slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(cells[6]).toEqual({ year: 2026, month: 10, day: 1 });
    expect(cells).toHaveLength(36);
  });
});
