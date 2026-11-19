import { z } from 'zod';

export const statsOverviewSchema = z.object({
  streakDays: z.number(),
  masteredCards: z.number(),
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
