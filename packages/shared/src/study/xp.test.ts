import { describe, expect, it } from 'vitest';
import { levelFromXp, scoreAnswers, trailingCombo, XP_RULES, type XpAnswer } from './xp';

const right = (extra: Partial<XpAnswer> = {}): XpAnswer => ({
  isCorrect: true,
  wasDue: false,
  recentlyCorrect: false,
  ...extra,
});
const wrong: XpAnswer = { isCorrect: false, wasDue: false, recentlyCorrect: false };
const fresh = { comboBefore: 0, earnedToday: 0 };

describe('scoreAnswers', () => {
  it('cộng XP cho câu đúng và thưởng thêm khi thẻ đến hạn', () => {
    expect(scoreAnswers([right(), right({ wasDue: true }), wrong], fresh)).toEqual({
      xp: 2 * XP_RULES.correct + XP_RULES.dueBonus,
      combo: 0,
    });
  });

  it('thưởng chuỗi 5 câu đúng liên tiếp, kể cả nối từ lô trước', () => {
    expect(scoreAnswers([right(), right()], { comboBefore: 3, earnedToday: 0 })).toEqual({
      xp: 2 * XP_RULES.correct + XP_RULES.comboBonus,
      combo: 5,
    });
  });

  it('câu sai làm đứt chuỗi', () => {
    const answers = [right(), right(), right(), right(), wrong, right()];
    expect(scoreAnswers(answers, fresh)).toEqual({ xp: 5 * XP_RULES.correct, combo: 1 });
  });

  it('câu đúng lặp lại trong 10 phút không có XP và không đứt chuỗi', () => {
    expect(scoreAnswers([right(), right({ recentlyCorrect: true }), right()], fresh)).toEqual({
      xp: 2 * XP_RULES.correct,
      combo: 2,
    });
  });

  it('câu tự chấm chỉ được ít XP, không thưởng, không tính chuỗi, quá nhanh thì không có', () => {
    const self = (timeMs: number) => right({ selfGraded: true, wasDue: true, timeMs });
    const answers = Array.from({ length: 5 }, () => self(XP_RULES.selfGradedMinMs));
    expect(scoreAnswers(answers, fresh)).toEqual({ xp: 5 * XP_RULES.selfGraded, combo: 0 });
    expect(scoreAnswers([self(XP_RULES.selfGradedMinMs - 1)], fresh).xp).toBe(0);
  });

  it('không vượt trần ngày', () => {
    expect(scoreAnswers([right(), right()], { comboBefore: 0, earnedToday: 495 }).xp).toBe(5);
    expect(scoreAnswers([right()], { comboBefore: 0, earnedToday: 600 }).xp).toBe(0);
  });
});

describe('levelFromXp', () => {
  it('tính cấp và XP trong cấp', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForNextLevel: 100 });
    expect(levelFromXp(99)).toEqual({ level: 1, xpIntoLevel: 99, xpForNextLevel: 100 });
    expect(levelFromXp(100)).toEqual({ level: 2, xpIntoLevel: 0, xpForNextLevel: 150 });
    expect(levelFromXp(260)).toEqual({ level: 3, xpIntoLevel: 10, xpForNextLevel: 200 });
  });
});

describe('trailingCombo', () => {
  it('đếm câu đúng liên tiếp ở cuối', () => {
    expect(trailingCombo([])).toBe(0);
    expect(trailingCombo([true, false, true, true])).toBe(2);
    expect(trailingCombo([true, true])).toBe(2);
  });
});
