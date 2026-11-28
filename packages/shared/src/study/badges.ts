/** Số liệu dùng để xét huy hiệu, server tính sau mỗi phiên học. */
export interface BadgeMetrics {
  masteredCards: number;
  streakDays: number;
  /** Số phiên Kiểm tra đúng hết. */
  perfectTests: number;
  /** Số bộ từ khác nhau đã học xong ít nhất một phiên. */
  setsStudied: number;
  /** Số ngày đạt mục tiêu XP. */
  goalDays: number;
  /** Số ngày có trả lời từ 23:00 đến 03:59 giờ Việt Nam. */
  nightDays: number;
  /** Điểm cao nhất một ván Mưa từ, trên mọi bộ từ và kiểu chơi. */
  wordRainBest: number;
}

export type BadgeMetric = keyof BadgeMetrics;

/**
 * Huy hiệu xếp theo nhóm, trong nhóm từ dễ đến khó. Mỗi nhóm có mốc khó (`hard`) để người học
 * lâu năm vẫn có thứ để chinh phục. Mã đã phát không được đổi vì lưu trong `UserBadge`.
 */
export const BADGES = [
  { code: 'mastered-100', metric: 'masteredCards', target: 100 },
  { code: 'mastered-500', metric: 'masteredCards', target: 500, hard: true },
  { code: 'streak-7', metric: 'streakDays', target: 7 },
  { code: 'streak-30', metric: 'streakDays', target: 30 },
  { code: 'streak-100', metric: 'streakDays', target: 100, hard: true },
  { code: 'perfect-test', metric: 'perfectTests', target: 1 },
  { code: 'perfect-test-10', metric: 'perfectTests', target: 10, hard: true },
  { code: 'sets-10', metric: 'setsStudied', target: 10 },
  { code: 'goal-7', metric: 'goalDays', target: 7 },
  { code: 'goal-30', metric: 'goalDays', target: 30, hard: true },
  { code: 'word-rain-5000', metric: 'wordRainBest', target: 5000, hard: true },
  { code: 'night-owl', metric: 'nightDays', target: 1 },
] as const satisfies readonly {
  code: string;
  metric: BadgeMetric;
  target: number;
  hard?: boolean;
}[];

export type BadgeCode = (typeof BADGES)[number]['code'];

export const BADGE_CODES = BADGES.map(({ code }) => code) as readonly BadgeCode[];

/** Mã các huy hiệu đã đạt theo số liệu, theo thứ tự của `BADGES`. */
export function earnedBadges(metrics: BadgeMetrics): BadgeCode[] {
  return BADGES.filter(({ metric, target }) => metrics[metric] >= target).map(({ code }) => code);
}
