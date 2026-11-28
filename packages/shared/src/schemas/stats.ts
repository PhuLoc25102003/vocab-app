import { z } from 'zod';
import { BADGE_CODES, type BadgeCode } from '../study/badges';
import { DAILY_GOAL_OPTIONS } from '../study/xp';
import { vm } from '../validation';

export const statsOverviewSchema = z.object({
  streakDays: z.number(),
  masteredCards: z.number(),
  /** Thẻ đã học nhưng chưa thuộc. Bản cũ của API không có trường này. */
  learningCards: z.number().default(0),
  /** Số câu trả lời 7 ngày gần nhất, ngày cũ nhất trước. */
  activity: z.array(z.object({ day: z.string(), answers: z.number() })).default([]),
  answersToday: z.number(),
  /** Số thẻ giữ chuỗi còn lại. Bản cũ của API không có trường này. */
  streakFreezes: z.number().default(0),
  /** Các ngày trong 7 ngày gần nhất đã dùng thẻ giữ chuỗi. */
  frozenDays: z.array(z.string()).default([]),
  dueCards: z.number(),
  hardCards: z.array(
    z.object({
      cardId: z.string(),
      setId: z.string(),
      term: z.string(),
      definition: z.string(),
      wrongCount: z.number(),
    }),
  ),
});
export type StatsOverview = z.infer<typeof statsOverviewSchema>;

export const statsOverviewResponseSchema = z.object({ data: statsOverviewSchema });

export const setProgressSchema = z.object({
  total: z.number(),
  mastered: z.number(),
  learning: z.number(),
  notStarted: z.number(),
  due: z.number(),
});
export type SetProgress = z.infer<typeof setProgressSchema>;

export const setProgressResponseSchema = z.object({ data: setProgressSchema });

export const cardProgressSchema = z.object({
  cardId: z.string(),
  level: z.enum(['new', 'learning', 'mastered']),
  /** Lần ôn tiếp theo, `null` khi thẻ chưa học. */
  dueAt: z.coerce.date().nullable(),
});
export type CardProgressItem = z.infer<typeof cardProgressSchema>;

export const cardProgressListResponseSchema = z.object({ data: z.array(cardProgressSchema) });

export const xpSummarySchema = z.object({
  totalXp: z.number(),
  level: z.number(),
  xpIntoLevel: z.number(),
  xpForNextLevel: z.number(),
  /** XP trong ngày học hiện tại (giờ Việt Nam). */
  todayXp: z.number(),
  dailyGoalXp: z.number(),
});
export type XpSummary = z.infer<typeof xpSummarySchema>;

export const xpSummaryResponseSchema = z.object({ data: xpSummarySchema });

export const updateDailyGoalSchema = z.object({
  dailyGoalXp: z
    .number(vm('dailyGoalInvalid'))
    .refine((value) => (DAILY_GOAL_OPTIONS as readonly number[]).includes(value), {
      message: vm('dailyGoalInvalid'),
    }),
});
export type UpdateDailyGoalInput = z.infer<typeof updateDailyGoalSchema>;

export const badgeCodeSchema = z
  .string()
  .refine((code): code is BadgeCode => (BADGE_CODES as readonly string[]).includes(code));

export const badgeSchema = z.object({
  code: badgeCodeSchema,
  /** Số liệu hiện tại, tối đa bằng `target`. */
  progress: z.number(),
  target: z.number(),
  /** Mốc thử thách. Bản cũ của API không có trường này. */
  hard: z.boolean().default(false),
  /** Lúc nhận huy hiệu, `null` khi chưa có. */
  earnedAt: z.coerce.date().nullable(),
});
export type Badge = z.infer<typeof badgeSchema>;

export const badgeListResponseSchema = z.object({ data: z.array(badgeSchema) });
