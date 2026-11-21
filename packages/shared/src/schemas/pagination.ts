import { z } from 'zod';

/** Chặn số trang quá lớn làm tràn `skip` khi truy vấn. */
export const MAX_PAGE = 100_000;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(MAX_PAGE).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().max(50).default('-updatedAt'),
});
export type Pagination = z.infer<typeof paginationSchema>;

export const paginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
});
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
