import { z } from 'zod';
import { roleSchema } from './auth';
import { paginationMetaSchema, paginationSchema } from './pagination';

export const LOCK_REASON_MAX_LENGTH = 500;

/** Tìm theo email hoặc tên hiển thị. */
export const adminUserQuerySchema = paginationSchema.extend({
  sort: z.string().max(50).default('-createdAt'),
  q: z.string().trim().max(100, 'Từ khoá tối đa 100 ký tự').optional(),
});
export type AdminUserQuery = z.infer<typeof adminUserQuerySchema>;

export const lockUserSchema = z.object({
  reason: z
    .string('Hãy nhập lý do khoá')
    .trim()
    .min(1, 'Hãy nhập lý do khoá')
    .max(LOCK_REASON_MAX_LENGTH, `Lý do tối đa ${LOCK_REASON_MAX_LENGTH} ký tự`),
});
export type LockUserDto = z.infer<typeof lockUserSchema>;

export const adminUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string(),
  role: roleSchema,
  createdAt: z.coerce.date(),
  lockedAt: z.coerce.date().nullable(),
  lockReason: z.string().nullable(),
  lockedById: z.string().nullable(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

export const adminUserListResponseSchema = z.object({
  data: z.array(adminUserSchema),
  meta: paginationMetaSchema,
});
export type AdminUserList = z.infer<typeof adminUserListResponseSchema>;
export const adminUserResponseSchema = z.object({ data: adminUserSchema });
