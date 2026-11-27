import { describe, expect, it } from 'vitest';
import { earnedBadges, type BadgeMetrics } from './badges';

const none: BadgeMetrics = {
  masteredCards: 0,
  streakDays: 0,
  perfectTests: 0,
  setsStudied: 0,
  goalDays: 0,
  nightDays: 0,
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
});
