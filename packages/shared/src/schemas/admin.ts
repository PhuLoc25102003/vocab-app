import { z } from 'zod';
import { vm } from '../validation';
import { roleSchema } from './auth';
import { paginationMetaSchema, paginationSchema } from './pagination';

export const LOCK_REASON_MAX_LENGTH = 500;

/** Lọc theo trạng thái tài khoản ở trang Quản lý người dùng. */
export const adminUserStatusSchema = z.enum(['active', 'locked', 'online']);
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

/** Lọc theo trạng thái kiểm duyệt bộ từ công khai ở trang quản trị. */
export const adminSetStatusSchema = z.enum(['all', 'visible', 'hidden']);
export type AdminSetStatus = z.infer<typeof adminSetStatusSchema>;

/** Bộ lọc danh sách bộ từ công khai của ADMIN. */
export const adminSetQuerySchema = paginationSchema.extend({
  q: z
    .string()
    .trim()
    .max(100, vm('keywordTooLong', { max: 100 }))
    .optional(),
  status: adminSetStatusSchema.default('all'),
});
export type AdminSetQuery = z.infer<typeof adminSetQuerySchema>;

/** Bộ lọc danh sách bộ từ bị ẩn của ADMIN (tương thích ngược). */
export const adminHiddenSetQuerySchema = paginationSchema.extend({
  q: z
    .string()
    .trim()
    .max(100, vm('keywordTooLong', { max: 100 }))
    .optional(),
});
export type AdminHiddenSetQuery = z.infer<typeof adminHiddenSetQuerySchema>;

/** Thông tin chi tiết một bộ từ công khai trong trang quản trị. */
export const adminSetItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  cardCount: z.number().int(),
  visibility: z.string(),
  hiddenAt: z.coerce.date().nullable(),
  hiddenReason: z.string().nullable(),
  owner: z.object({
    id: z.string(),
    displayName: z.string(),
    email: z.string(),
  }),
  hiddenBy: z
    .object({
      id: z.string(),
      displayName: z.string(),
    })
    .nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type AdminSetItem = z.infer<typeof adminSetItemSchema>;

export const adminSetListResponseSchema = z.object({
  data: z.array(adminSetItemSchema),
  meta: paginationMetaSchema,
});
export type AdminSetList = z.infer<typeof adminSetListResponseSchema>;

/** Thông tin chi tiết một bộ từ bị ẩn (tương thích ngược). */
export const adminHiddenSetItemSchema = adminSetItemSchema;
export type AdminHiddenSetItem = z.infer<typeof adminHiddenSetItemSchema>;

export const adminHiddenSetListResponseSchema = adminSetListResponseSchema;
export type AdminHiddenSetList = z.infer<typeof adminHiddenSetListResponseSchema>;

/** Thành viên học sinh trong lớp học cho góc nhìn quản trị. */
export const adminClassMemberSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.string(),
  joinedAt: z.coerce.date(),
});
export type AdminClassMember = z.infer<typeof adminClassMemberSchema>;

/** Thông tin lớp học do giáo viên quản lý cho góc nhìn quản trị. */
export const adminClassItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  joinCode: z.string(),
  archivedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  teacher: z
    .object({
      id: z.string(),
      displayName: z.string(),
      email: z.string(),
    })
    .optional(),
  memberCount: z.number().int(),
  assignmentCount: z.number().int(),
  members: z.array(adminClassMemberSchema),
});
export type AdminClassItem = z.infer<typeof adminClassItemSchema>;

/** Thông tin giáo viên cùng các lớp học phụ trách cho góc nhìn quản trị. */
export const adminTeacherItemSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.string(),
  createdAt: z.coerce.date(),
  classCount: z.number().int(),
  totalStudents: z.number().int(),
  classes: z.array(adminClassItemSchema),
});
export type AdminTeacherItem = z.infer<typeof adminTeacherItemSchema>;

/** Học sinh chưa tham gia bất kỳ lớp học nào, kèm trạng thái khoá tài khoản. */
export const adminUnassignedStudentSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.string(),
  createdAt: z.coerce.date(),
  lockedAt: z.coerce.date().nullable(),
  lockReason: z.string().nullable(),
});
export type AdminUnassignedStudent = z.infer<typeof adminUnassignedStudentSchema>;

/** Tổng quan toàn bộ lớp học của từng giáo viên và học sinh chưa có lớp. */
export const adminClassesOverviewResponseSchema = z.object({
  data: z.object({
    teachers: z.array(adminTeacherItemSchema),
    classes: z.array(adminClassItemSchema).optional(),
    unassignedStudents: z.array(adminUnassignedStudentSchema),
    totalTeachers: z.number().int(),
    totalClasses: z.number().int(),
    totalStudentsInClasses: z.number().int(),
    totalUnassignedStudents: z.number().int(),
  }),
});
export type AdminClassesOverview = z.infer<typeof adminClassesOverviewResponseSchema>['data'];

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

/** Tiến độ một kỹ năng/chế độ học của người dùng trong một bộ từ. */
export const adminRecentStudyModeSchema = z.object({
  mode: z.string(),
  startedAt: z.coerce.date(),
  finishedAt: z.coerce.date().nullable(),
  answered: z.number().int(),
  correct: z.number().int(),
  total: z.number().int(),
});
export type AdminRecentStudyMode = z.infer<typeof adminRecentStudyModeSchema>;

/** Thông tin một bộ từ học gần đây của người dùng cho ADMIN theo dõi */
export const adminRecentStudySetSchema = z.object({
  setId: z.string(),
  title: z.string(),
  cardCount: z.number().int().default(0),
  mode: z.string(),
  startedAt: z.coerce.date(),
  correct: z.number().int(),
  total: z.number().int(),
  modes: z.array(adminRecentStudyModeSchema).default([]),
});
export type AdminRecentStudySet = z.infer<typeof adminRecentStudySetSchema>;

export const adminUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string(),
  role: roleSchema,
  createdAt: z.coerce.date(),
  lockedAt: z.coerce.date().nullable(),
  lockReason: z.string().nullable(),
  lockedById: z.string().nullable(),
  isOnline: z.boolean().default(false),
  lastActiveAt: z.coerce.date().nullable().optional(),
  recentSets: z.array(adminRecentStudySetSchema).default([]),
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
