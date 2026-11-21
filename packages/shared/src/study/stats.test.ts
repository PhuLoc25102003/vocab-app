import { describe, expect, it } from 'vitest';
import {
  cardMastery,
  computeStreak,
  MASTERED_INTERVAL_DAYS,
  startOfStudyDay,
  toStudyDay,
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
