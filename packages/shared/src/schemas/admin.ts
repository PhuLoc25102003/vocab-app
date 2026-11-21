import { z } from 'zod';
import { vm } from '../validation';
import { roleSchema } from './auth';
import { paginationMetaSchema, paginationSchema } from './pagination';

export const LOCK_REASON_MAX_LENGTH = 500;

/** Lọc theo trạng thái tài khoản ở trang Quản lý người dùng. */
export const adminUserStatusSchema = z.enum(['active', 'locked']);
export type AdminUserStatus = z.infer<typeof adminUserStatusSchema>;

export const ADMIN_USER_SORTS = ['-createdAt', 'createdAt', 'displayName', 'email'] as const;
export type AdminUserSort = (typeof ADMIN_USER_SORTS)[number];

/** Tìm theo email hoặc tên hiển thị, lọc theo vai trò và trạng thái. */
export const adminUserQuerySchema = paginationSchema.extend({
  sort: z.string().max(50).default('-createdAt'),
  q: z
    .string()
    .trim()
    .max(100, vm('keywordTooLong', { max: 100 }))
    .optional(),
  role: roleSchema.optional(),
  status: adminUserStatusSchema.optional(),
});
export type AdminUserQuery = z.infer<typeof adminUserQuerySchema>;

/** Lý do ẩn bộ từ vi phạm, cùng giới hạn với lý do khoá tài khoản. */
export const hideSetSchema = z.object({
  reason: z
    .string(vm('required', { field: 'hideReason' }))
    .trim()
    .min(1, vm('required', { field: 'hideReason' }))
    .max(LOCK_REASON_MAX_LENGTH, vm('reasonTooLong', { max: LOCK_REASON_MAX_LENGTH })),
});
export type HideSetDto = z.infer<typeof hideSetSchema>;

export const hiddenSetSchema = z.object({
  id: z.string(),
  title: z.string(),
  hiddenAt: z.coerce.date().nullable(),
  hiddenReason: z.string().nullable(),
  hiddenById: z.string().nullable(),
});
export type HiddenSet = z.infer<typeof hiddenSetSchema>;
export const hiddenSetResponseSchema = z.object({ data: hiddenSetSchema });

export const lockUserSchema = z.object({
  reason: z
    .string(vm('required', { field: 'lockReason' }))
    .trim()
    .min(1, vm('required', { field: 'lockReason' }))
    .max(LOCK_REASON_MAX_LENGTH, vm('reasonTooLong', { max: LOCK_REASON_MAX_LENGTH })),
});
export type LockUserDto = z.infer<typeof lockUserSchema>;

/** ADMIN đổi vai trò trực tiếp, ví dụ cấp quyền giáo viên (việc 3.2). */
export const setUserRoleSchema = z.object({ role: roleSchema });
export type SetUserRoleDto = z.infer<typeof setUserRoleSchema>;

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

export const adminStatsSchema = z.object({
  users: z.number(),
  lockedUsers: z.number(),
  sets: z.number(),
  hiddenSets: z.number(),
  /** Các trường dưới đây thêm ở việc 5.21. */
  newUsers: z.number().int(),
  /** Người có ít nhất một phiên học trong 7 ngày. */
  activeUsers: z.number().int(),
  sessions: z.number().int(),
  publicSets: z.number().int(),
  roles: z.object({
    STUDENT: z.number().int(),
    TEACHER: z.number().int(),
    ADMIN: z.number().int(),
  }),
  /** 30 ngày học (giờ Việt Nam), cũ nhất trước. */
  daily: z.array(
    z.object({ day: z.string(), signups: z.number().int(), active: z.number().int() }),
  ),
  recentUsers: z.array(
    z.object({
      id: z.string(),
      displayName: z.string(),
      email: z.string(),
      role: roleSchema,
      createdAt: z.string(),
    }),
  ),
  /** Bộ công khai tạo trong 7 ngày, chưa ẩn: hàng chờ rà nội dung. */
  newPublicSets: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      ownerName: z.string(),
      cardCount: z.number().int(),
      createdAt: z.string(),
    }),
  ),
});
export type AdminStats = z.infer<typeof adminStatsSchema>;
export const adminStatsResponseSchema = z.object({ data: adminStatsSchema });
