import { describe, expect, it } from 'vitest';
import { applyReview, createSrsState, SRS_CONFIG, type SrsState } from './srs';

const NOW = new Date('2026-01-01T00:00:00.000Z');
const DAY_MS = 86_400_000;

const daysAfterNow = (days: number) => new Date(NOW.getTime() + days * DAY_MS);

const reviewedState = (overrides: Partial<SrsState> = {}): SrsState => ({
  ...createSrsState(NOW),
  ease: 2.5,
  interval: 6,
  reps: 2,
  lastResult: true,
  ...overrides,
});

describe('createSrsState', () => {
  it('matches the CardProgress defaults and is due immediately', () => {
    expect(createSrsState(NOW)).toEqual({
      ease: 2.5,
      interval: 0,
      reps: 0,
      lapses: 0,
      dueAt: NOW,
      lastResult: null,
    });
  });
});

describe('applyReview when correct', () => {
  it('schedules a new card for the next day', () => {
    expect(applyReview(createSrsState(NOW), true, NOW)).toEqual({
      ease: 2.55,
      interval: 1,
      reps: 1,
      lapses: 0,
      dueAt: daysAfterNow(1),
      lastResult: true,
    });
  });

  it('uses the fixed second interval', () => {
    const next = applyReview(reviewedState({ reps: 1, interval: 1 }), true, NOW);

    expect(next.interval).toBe(6);
    expect(next.dueAt).toEqual(daysAfterNow(6));
  });

  it('multiplies the interval by ease from the third review', () => {
    const next = applyReview(reviewedState(), true, NOW);

    expect(next.interval).toBe(15);
    expect(next.reps).toBe(3);
  });

  it('caps the interval', () => {
    const next = applyReview(reviewedState({ interval: 300 }), true, NOW);

    expect(next.interval).toBe(SRS_CONFIG.maxIntervalDays);
  });

  it('caps ease', () => {
    const next = applyReview(reviewedState({ ease: SRS_CONFIG.maxEase }), true, NOW);

    expect(next.ease).toBe(SRS_CONFIG.maxEase);
  });

  it('reviews a card exactly at its due time', () => {
    expect(applyReview(reviewedState({ dueAt: NOW }), true, NOW).reps).toBe(3);
  });

  it('keeps the schedule when the card is not due yet', () => {
    const state = reviewedState({ dueAt: daysAfterNow(3), lastResult: false });

    expect(applyReview(state, true, NOW)).toEqual({ ...state, lastResult: true });
  });
});

describe('applyReview when wrong', () => {
  it('resets a remembered card and counts a lapse', () => {
    expect(applyReview(reviewedState({ lapses: 1 }), false, NOW)).toEqual({
      ease: 2.3,
      interval: 0,
      reps: 0,
      lapses: 2,
      dueAt: new Date(NOW.getTime() + SRS_CONFIG.retryMinutes * 60_000),
      lastResult: false,
    });
  });

  it('does not penalize a card that was never remembered', () => {
    const next = applyReview(createSrsState(NOW), false, NOW);

    expect(next.ease).toBe(SRS_CONFIG.initialEase);
    expect(next.lapses).toBe(0);
    expect(next.lastResult).toBe(false);
  });

  it('keeps ease above the minimum', () => {
    const next = applyReview(reviewedState({ ease: SRS_CONFIG.minEase }), false, NOW);

    expect(next.ease).toBe(SRS_CONFIG.minEase);
  });

  it('applies even when the card is not due yet', () => {
    const next = applyReview(reviewedState({ dueAt: daysAfterNow(3) }), false, NOW);

    expect(next.reps).toBe(0);
    expect(next.lapses).toBe(1);
  });

  it('restarts from the first interval after a retry', () => {
    const failed = applyReview(reviewedState(), false, NOW);
    const retried = applyReview(failed, true, failed.dueAt);

    expect(retried.interval).toBe(SRS_CONFIG.firstIntervalDays);
    expect(retried.reps).toBe(1);
  });
});

describe('applyReview purity', () => {
  it('does not mutate the given state', () => {
    const state = Object.freeze(reviewedState());

    expect(() => applyReview(state, true, NOW)).not.toThrow();
    expect(() => applyReview(state, false, NOW)).not.toThrow();
  });
});
