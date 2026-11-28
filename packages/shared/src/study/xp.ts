/** Quy tắc XP dùng chung: server cộng XP theo các hằng số này, web hiển thị cùng con số. */
export const XP_RULES = {
  /** Mỗi câu đúng. */
  correct: 10,
  /** Thêm khi trả lời đúng một thẻ đã đến hạn ôn. */
  dueBonus: 5,
  /** Cứ đủ số câu đúng liên tiếp này trong một phiên thì được thưởng. */
  comboSize: 5,
  comboBonus: 5,
  /** Thẻ đã trả lời đúng trong khoảng này thì không được cộng lại. */
  repeatWindowMs: 10 * 60_000,
  /** Trần XP mỗi ngày học. */
  dailyCap: 500,
  /**
   * Chế độ người học tự chấm (Xem thẻ: bấm "Biết rồi") không kiểm chứng được, nên mỗi câu "biết"
   * chỉ được chừng này XP, không có thưởng thẻ đến hạn và không tính vào chuỗi.
   */
  selfGraded: 2,
  /** Tự chấm nhanh hơn mức này (lật rồi bấm liền) thì không có XP. */
  selfGradedMinMs: 1500,
} as const;

/** Mục tiêu XP mỗi ngày, khoảng 5, 10, 20, 30 câu đúng. */
export const DAILY_GOAL_OPTIONS = [50, 100, 200, 300] as const;
export type DailyGoalXp = (typeof DAILY_GOAL_OPTIONS)[number];
export const DEFAULT_DAILY_GOAL_XP: DailyGoalXp = 100;

export interface XpAnswer {
  isCorrect: boolean;
  /** Thẻ đã có lịch ôn và đã tới hạn khi trả lời. */
  wasDue: boolean;
  /** Thẻ vừa được trả lời đúng trong `repeatWindowMs`. */
  recentlyCorrect: boolean;
  /** Đáp án do người học tự chấm (chế độ có `selfGraded`). */
  selfGraded?: boolean;
  /** Thời gian trả lời, chỉ dùng để chặn tự chấm quá nhanh. */
  timeMs?: number;
}

export interface XpScore {
  /** XP được cộng sau khi áp trần ngày. */
  xp: number;
  /** Số câu đúng liên tiếp sau lô này, dùng cho lô kế tiếp. */
  combo: number;
}

/**
 * Tính XP cho một lô đáp án theo thứ tự trả lời. `comboBefore` là số câu đúng liên tiếp ở cuối
 * các lô trước của cùng phiên, `earnedToday` là XP đã nhận trong ngày học hiện tại.
 * Câu đúng lặp lại trong 10 phút không có XP và không tính vào chuỗi, nhưng cũng không làm đứt chuỗi.
 * Câu tự chấm "biết" chỉ được `selfGraded` XP (không có nếu trả lời dưới `selfGradedMinMs`), không
 * có thưởng và không tính vào chuỗi.
 */
export function scoreAnswers(
  answers: readonly XpAnswer[],
  { comboBefore, earnedToday }: { comboBefore: number; earnedToday: number },
): XpScore {
  let raw = 0;
  let combo = comboBefore;
  for (const answer of answers) {
    if (!answer.isCorrect) {
      combo = 0;
      continue;
    }
    if (answer.recentlyCorrect) {
      continue;
    }
    if (answer.selfGraded) {
      if ((answer.timeMs ?? Number.POSITIVE_INFINITY) >= XP_RULES.selfGradedMinMs) {
        raw += XP_RULES.selfGraded;
      }
      continue;
    }
    raw += XP_RULES.correct + (answer.wasDue ? XP_RULES.dueBonus : 0);
    combo += 1;
    if (combo % XP_RULES.comboSize === 0) {
      raw += XP_RULES.comboBonus;
    }
  }
  const room = Math.max(0, XP_RULES.dailyCap - earnedToday);
  return { xp: Math.min(raw, room), combo };
}

/** XP cần để đi từ cấp `level` lên cấp kế tiếp: 100, 150, 200, ... */
export function xpForLevel(level: number): number {
  return 100 + (level - 1) * 50;
}

export interface LevelInfo {
  level: number;
  /** XP đã có trong cấp hiện tại. */
  xpIntoLevel: number;
  /** XP cần để lên cấp kế tiếp. */
  xpForNextLevel: number;
}

export function levelFromXp(totalXp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp));
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: xpForLevel(level) };
}

/** Số câu đúng liên tiếp ở cuối danh sách đáp án (thứ tự cũ trước). */
export function trailingCombo(results: readonly boolean[]): number {
  let combo = 0;
  for (let index = results.length - 1; index >= 0 && results[index]; index -= 1) {
    combo += 1;
  }
  return combo;
}
