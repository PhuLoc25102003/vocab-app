import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  db: z.literal('up'),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    requestId: z.string(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
