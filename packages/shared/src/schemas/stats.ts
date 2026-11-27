import { z } from 'zod';

export const statsOverviewSchema = z.object({
  streakDays: z.number(),
  masteredCards: z.number(),
  /** Thẻ đã học nhưng chưa thuộc. Bản cũ của API không có trường này. */
  learningCards: z.number().default(0),
  /** Số câu trả lời 7 ngày gần nhất, ngày cũ nhất trước. */
  activity: z.array(z.object({ day: z.string(), answers: z.number() })).default([]),
  answersToday: z.number(),
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
