import { describe, expect, it } from 'vitest';
import {
  cardMastery,
  computeStreak,
  freezableDay,
  grantStreakFreezes,
  MASTERED_INTERVAL_DAYS,
  startOfStudyDay,
  startOfStudyWeek,
  toStudyDay,
  toStudyWeek,
} from './stats';

const NOW = new Date('2026-03-10T05:00:00.000Z');

describe('toStudyDay', () => {
  it('uses Vietnam time', () => {
    expect(toStudyDay(new Date('2026-03-09T16:59:59.000Z'))).toBe('2026-03-09');
    expect(toStudyDay(new Date('2026-03-09T17:00:00.000Z'))).toBe('2026-03-10');
  });
});

describe('startOfStudyDay', () => {
  it('returns midnight in Vietnam', () => {
    expect(startOfStudyDay(NOW).toISOString()).toBe('2026-03-09T17:00:00.000Z');
  });
});

describe('computeStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(computeStreak(['2026-03-10', '2026-03-09', '2026-03-08'], NOW)).toBe(3);
  });

  it('keeps the streak when only yesterday was studied', () => {
    expect(computeStreak(['2026-03-09', '2026-03-08'], NOW)).toBe(2);
  });

  it('stops at a gap', () => {
    expect(computeStreak(['2026-03-10', '2026-03-08'], NOW)).toBe(1);
  });

  it('is zero when the last study day is too old', () => {
    expect(computeStreak(['2026-03-08'], NOW)).toBe(0);
    expect(computeStreak([], NOW)).toBe(0);
  });

  it('crosses month boundaries', () => {
    const now = new Date('2026-03-01T05:00:00.000Z');

    expect(computeStreak(['2026-03-01', '2026-02-28'], now)).toBe(2);
  });
});

describe('cardMastery', () => {
  it('chưa học là mới, khoảng ôn dưới 6 ngày là đang học, từ 6 ngày là đã thuộc', () => {
    expect(cardMastery(null)).toBe('new');
    expect(cardMastery({ interval: 0 })).toBe('learning');
    expect(cardMastery({ interval: MASTERED_INTERVAL_DAYS - 1 })).toBe('learning');
    expect(cardMastery({ interval: MASTERED_INTERVAL_DAYS })).toBe('mastered');
  });
});

// NOW là thứ Ba 2026-03-10 giờ Việt Nam.
describe('thẻ giữ chuỗi', () => {
  it('ngày có thẻ nối chuỗi nhưng không tính thêm ngày', () => {
    expect(computeStreak(['2026-03-10', '2026-03-08', '2026-03-07'], NOW, ['2026-03-09'])).toBe(3);
    expect(computeStreak(['2026-03-08'], NOW, ['2026-03-09'])).toBe(1);
  });

  it('tuần học bắt đầu từ thứ Hai giờ Việt Nam', () => {
    expect(toStudyWeek(NOW)).toBe('2026-03-09');
    expect(toStudyWeek(new Date('2026-03-08T16:59:00.000Z'))).toBe('2026-03-02');
    expect(startOfStudyWeek(NOW).toISOString()).toBe('2026-03-08T17:00:00.000Z');
  });

  it('cấp một thẻ mỗi thứ Hai, giữ tối đa 2', () => {
    expect(grantStreakFreezes(1, null, NOW)).toEqual({ held: 1, week: '2026-03-09' });
    expect(grantStreakFreezes(0, '2026-03-02', NOW)).toEqual({ held: 1, week: '2026-03-09' });
    expect(grantStreakFreezes(1, '2026-02-16', NOW)).toEqual({ held: 2, week: '2026-03-09' });
    expect(grantStreakFreezes(1, '2026-03-09', NOW)).toEqual({ held: 1, week: '2026-03-09' });
  });

  it('chỉ dùng thẻ khi bỏ lỡ đúng hôm qua', () => {
    expect(freezableDay(['2026-03-08'], [], NOW)).toBe('2026-03-09');
    expect(freezableDay(['2026-03-09'], [], NOW)).toBeNull();
    expect(freezableDay(['2026-03-08'], ['2026-03-09'], NOW)).toBeNull();
    expect(freezableDay(['2026-03-07'], [], NOW)).toBeNull();
  });
});
