import { z } from 'zod';

/** Số người đứng đầu trả về trong bảng xếp hạng. */
export const LEADERBOARD_SIZE = 50;

export const leaderboardQuerySchema = z.object({
  week: z.enum(['current', 'previous']).default('current'),
});
export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;

export const leaderboardEntrySchema = z.object({
  rank: z.number(),
  displayName: z.string(),
  xp: z.number(),
  isMe: z.boolean(),
});
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

export const leaderboardSchema = z.object({
  /** Thứ Hai đầu tuần (giờ Việt Nam), dạng YYYY-MM-DD. */
  week: z.string(),
  entries: z.array(leaderboardEntrySchema),
  /** Hạng của tôi, kể cả khi ngoài top; `null` khi tuần này chưa có XP. */
  me: leaderboardEntrySchema.nullable(),
  /** Bảng chung: tôi đã ẩn tên với người khác. Bảng lớp luôn `false`. */
  hidden: z.boolean(),
  /** Bảng lớp: giáo viên đang bật bảng cho học sinh. Bảng chung luôn `true`. */
  enabled: z.boolean(),
});
export type Leaderboard = z.infer<typeof leaderboardSchema>;

export const leaderboardResponseSchema = z.object({ data: leaderboardSchema });

export const leaderboardVisibilitySchema = z.object({ hidden: z.boolean() });
export type LeaderboardVisibilityInput = z.infer<typeof leaderboardVisibilitySchema>;

export const leaderboardVisibilityResponseSchema = z.object({ data: leaderboardVisibilitySchema });
