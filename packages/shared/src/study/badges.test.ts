import { describe, expect, it } from 'vitest';
import { earnedBadges, type BadgeMetrics } from './badges';

const none: BadgeMetrics = {
  masteredCards: 0,
  streakDays: 0,
  perfectTests: 0,
  setsStudied: 0,
  goalDays: 0,
  nightDays: 0,
  wordRainBest: 0,
};

describe('earnedBadges', () => {
  it('chưa có số liệu thì chưa có huy hiệu', () => {
    expect(earnedBadges(none)).toEqual([]);
  });

  it('đạt đúng ngưỡng là có huy hiệu', () => {
    expect(earnedBadges({ ...none, streakDays: 7, perfectTests: 1 })).toEqual([
      'streak-7',
      'perfect-test',
    ]);
    expect(earnedBadges({ ...none, streakDays: 30, masteredCards: 99 })).toEqual([
      'streak-7',
      'streak-30',
    ]);
  });

  it('mốc khó cần số liệu lớn, gồm cả điểm Mưa từ', () => {
    expect(
      earnedBadges({
        ...none,
        masteredCards: 500,
        streakDays: 100,
        perfectTests: 10,
        goalDays: 30,
        wordRainBest: 5000,
      }),
    ).toEqual([
      'mastered-100',
      'mastered-500',
      'streak-7',
      'streak-30',
      'streak-100',
      'perfect-test',
      'perfect-test-10',
      'goal-7',
      'goal-30',
      'word-rain-5000',
    ]);
    expect(earnedBadges({ ...none, wordRainBest: 4999 })).toEqual([]);
  });
});
