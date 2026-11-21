import { z } from 'zod';
import { studyModeSchema } from '../study/types';
import { paginationMetaSchema, paginationSchema } from './pagination';

export const CLASS_NAME_MAX_LENGTH = 80;
export const CLASS_DESCRIPTION_MAX_LENGTH = 500;
/** Bỏ chữ dễ nhầm (I, O, 0, 1) để học sinh gõ lại mã không sai. */
export const JOIN_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const JOIN_CODE_LENGTH = 6;

const classNameSchema = z
  .string('Hãy nhập tên lớp')
  .trim()
  .min(1, 'Hãy nhập tên lớp')
  .max(CLASS_NAME_MAX_LENGTH, `Tên lớp tối đa ${CLASS_NAME_MAX_LENGTH} ký tự`)
  .regex(/^\P{Cc}+$/u, 'Tên lớp chứa ký tự không hợp lệ');

/** Chuỗi rỗng sau khi bỏ khoảng trắng nghĩa là xoá mô tả. */
const classDescriptionSchema = z
  .string()
  .trim()
  .max(CLASS_DESCRIPTION_MAX_LENGTH, `Mô tả tối đa ${CLASS_DESCRIPTION_MAX_LENGTH} ký tự`)
  .transform((value) => (value === '' ? null : value));

export const createClassSchema = z.object({
  name: classNameSchema,
  description: classDescriptionSchema.optional(),
});
export type CreateClassInput = z.infer<typeof createClassSchema>;

export const updateClassSchema = z
  .object({
    name: classNameSchema.optional(),
    description: classDescriptionSchema.optional(),
    /** `true` lưu trữ lớp, `false` mở lại. */
    archived: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Không có thay đổi nào',
  });
export type UpdateClassInput = z.infer<typeof updateClassSchema>;

export const LIST_SEARCH_MAX_LENGTH = 100;

export const CLASS_SORTS = ['-createdAt', 'name', '-memberCount'] as const;
export type ClassSort = (typeof CLASS_SORTS)[number];

export const classListQuerySchema = paginationSchema.extend({
  /** Mặc định chỉ trả lớp đang hoạt động. */
  archived: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  /** Tìm theo tên lớp, không phân biệt hoa thường (việc 5.33). */
  q: z.string().trim().max(LIST_SEARCH_MAX_LENGTH).optional(),
  sort: z.enum(CLASS_SORTS).catch('-createdAt').default('-createdAt'),
});
export type ClassListQuery = z.infer<typeof classListQuerySchema>;

export const classSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  joinCode: z.string(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  memberCount: z.number(),
});
export type Class = z.infer<typeof classSchema>;

/** Lớp trong danh sách của giáo viên kèm số liệu nhanh (việc 5.16a). */
export const classListItemSchema = classSchema.extend({
  /** Bài chưa tới hạn hoặc không có hạn. */
  openAssignmentCount: z.number().int(),
  /** Phần trăm bài nộp đúng hạn trong 30 ngày qua, `null` khi chưa có bài nào hết hạn. */
  onTimeRate: z.number().int().nullable(),
});
export type ClassListItem = z.infer<typeof classListItemSchema>;

export const classListSchema = z.object({
  data: z.array(classListItemSchema),
  meta: paginationMetaSchema,
});
export type ClassList = z.infer<typeof classListSchema>;

export const classResponseSchema = z.object({ data: classSchema });

export const joinClassSchema = z.object({
  joinCode: z
    .string('Hãy nhập mã lớp')
    .trim()
    .toUpperCase()
    .length(JOIN_CODE_LENGTH, `Mã lớp gồm ${JOIN_CODE_LENGTH} ký tự`)
    .regex(new RegExp(`^[${JOIN_CODE_ALPHABET}]+$`), 'Mã lớp không hợp lệ'),
});
export type JoinClassInput = z.infer<typeof joinClassSchema>;

/** `joinedAt` theo thứ tự vào lớp, `name` theo tên A đến Z, dấu `-` để đảo chiều. */
export const CLASS_MEMBER_SORTS = ['joinedAt', '-joinedAt', 'name', '-name'] as const;
export const CLASS_MEMBER_SEARCH_MAX_LENGTH = 100;

export const classMemberListQuerySchema = paginationSchema.extend({
  sort: z.enum(CLASS_MEMBER_SORTS).catch('joinedAt').default('joinedAt'),
  /** Tìm theo tên hiển thị, không phân biệt hoa thường. */
  q: z.string().trim().max(CLASS_MEMBER_SEARCH_MAX_LENGTH).optional(),
});
export type ClassMemberListQuery = z.infer<typeof classMemberListQuerySchema>;

/**
 * Số liệu một học sinh qua các bài giao của lớp (việc 5.15). Chỉ tính bài có hạn từ lúc em vào
 * lớp trở đi; `pending` là bài chưa tới hạn (hoặc không hạn) và chưa nộp.
 */
export const memberStatsSchema = z.object({
  onTime: z.number().int(),
  late: z.number().int(),
  missed: z.number().int(),
  pending: z.number().int(),
  /** Phần trăm trung bình của các bài nộp có điểm, một chữ số thập phân, `null` khi chưa có. */
  averageScore: z.number().nullable(),
  /** Lần gần nhất bắt đầu một phiên học gắn bài của lớp, `null` khi chưa học. */
  lastActiveAt: z.string().nullable(),
});
export type MemberStats = z.infer<typeof memberStatsSchema>;

/** Giáo viên chỉ cần tên hiển thị để nhận ra học sinh, không lộ email. */
export const classMemberSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  joinedAt: z.string(),
  stats: memberStatsSchema,
});
export type ClassMember = z.infer<typeof classMemberSchema>;

export const classMemberResponseSchema = z.object({ data: classMemberSchema });

export const classMemberListSchema = z.object({
  data: z.array(classMemberSchema),
  meta: paginationMetaSchema,
});
export type ClassMemberList = z.infer<typeof classMemberListSchema>;

export const joinedClassListQuerySchema = paginationSchema.extend({
  /** Tìm theo tên lớp, không phân biệt hoa thường (việc 5.30). */
  q: z.string().trim().max(LIST_SEARCH_MAX_LENGTH).optional(),
});
export type JoinedClassListQuery = z.infer<typeof joinedClassListQuerySchema>;

export const joinedClassSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  teacherName: z.string(),
  joinedAt: z.string(),
});
export type JoinedClass = z.infer<typeof joinedClassSchema>;

export const joinedClassListSchema = z.object({
  data: z.array(joinedClassSchema),
  meta: paginationMetaSchema,
});
export type JoinedClassList = z.infer<typeof joinedClassListSchema>;

export const joinedClassResponseSchema = z.object({ data: joinedClassSchema });

/** Giao được tới tất cả chế độ (việc 5.27), mỗi chế độ một lần. */
export const MAX_ASSIGNMENT_MODES = studyModeSchema.options.length;

export const createAssignmentSchema = z
  .object({
    setId: z.string('Hãy chọn bộ từ').min(1, 'Hãy chọn bộ từ').max(64),
    /** Các chế độ phải làm theo thứ tự (việc 5.11). */
    modes: z
      .array(studyModeSchema)
      .min(1, 'Chọn ít nhất một chế độ')
      .max(MAX_ASSIGNMENT_MODES, `Chọn tối đa ${MAX_ASSIGNMENT_MODES} chế độ`)
      .refine((modes) => new Set(modes).size === modes.length, 'Mỗi chế độ chỉ chọn một lần')
      .optional(),
    /** Cách gửi cũ một chế độ, vẫn nhận để web cũ chạy được. */
    mode: studyModeSchema.optional(),
    /** Thời điểm hết hạn theo ISO 8601, bỏ trống là không có hạn. */
    dueAt: z.iso.datetime({ offset: true, message: 'Hạn nộp không hợp lệ' }).nullable().optional(),
    /** Bộ đang riêng tư: đồng ý cho học sinh trong lớp xem, bộ chuyển sang `CLASS`. */
    shareToClass: z.boolean().optional(),
  })
  .refine((dto) => dto.modes ?? dto.mode, {
    path: ['modes'],
    message: 'Chọn ít nhất một chế độ',
  })
  .transform(({ mode, modes, ...rest }) => ({
    ...rest,
    modes: modes ?? (mode ? [mode] : []),
  }));
export type CreateAssignmentInput = z.input<typeof createAssignmentSchema>;
export type CreateAssignmentDto = z.output<typeof createAssignmentSchema>;

/** `open`: chưa có hạn hoặc chưa tới hạn; `closed`: đã quá hạn (việc 5.32). */
export const ASSIGNMENT_WINDOWS = ['open', 'closed', 'all'] as const;
export const assignmentWindowSchema = z.enum(ASSIGNMENT_WINDOWS);
export type AssignmentWindow = z.infer<typeof assignmentWindowSchema>;

export const assignmentListQuerySchema = paginationSchema.extend({
  status: assignmentWindowSchema.catch('all').default('all'),
  /** Tìm theo tên bộ từ. */
  q: z.string().trim().max(LIST_SEARCH_MAX_LENGTH).optional(),
  /** `due`: hạn gần nhất trước, không hạn xếp cuối (mặc định); `-createdAt`: mới giao trước. */
  sort: z.enum(['due', '-createdAt']).catch('due').default('due'),
});
export type AssignmentListQuery = z.infer<typeof assignmentListQuerySchema>;

export const assignmentSchema = z.object({
  id: z.string(),
  classId: z.string(),
  setId: z.string(),
  setTitle: z.string(),
  mode: studyModeSchema,
  /** Có ở `POST`, `GET /classes/:id/assignments`; các danh sách khác thêm ở việc 5.12. */
  modes: z.array(studyModeSchema).optional(),
  dueAt: z.string().nullable(),
  createdAt: z.string(),
});
export type Assignment = z.infer<typeof assignmentSchema>;

export const assignmentResponseSchema = z.object({ data: assignmentSchema });

/** Bài trong danh sách của giáo viên kèm số học sinh hiện trong lớp đã nộp (việc 5.32). */
export const classAssignmentSchema = assignmentSchema.extend({
  submittedCount: z.number().int(),
  memberCount: z.number().int(),
});
export type ClassAssignment = z.infer<typeof classAssignmentSchema>;

export const assignmentListSchema = z.object({
  data: z.array(classAssignmentSchema),
  meta: paginationMetaSchema,
  /** Số bài từng tab sau khi tìm. */
  counts: z.object({ open: z.number().int(), closed: z.number().int(), all: z.number().int() }),
});
export type AssignmentList = z.infer<typeof assignmentListSchema>;

export const ASSIGNMENT_STATUSES = ['pending', 'done', 'overdue'] as const;
export const assignmentStatusSchema = z.enum(ASSIGNMENT_STATUSES);
export type AssignmentStatus = z.infer<typeof assignmentStatusSchema>;

/** `todo`: chưa làm, đang làm, bỏ lỡ; `done`: đã nộp, nộp trễ (việc 5.30). */
export const ASSIGNMENT_GROUPS = ['todo', 'done', 'all'] as const;
export const assignmentGroupSchema = z.enum(ASSIGNMENT_GROUPS);
export type AssignmentGroup = z.infer<typeof assignmentGroupSchema>;

export const myAssignmentListQuerySchema = paginationSchema.extend({
  group: assignmentGroupSchema.catch('all').default('all'),
  classId: z.string().max(64).optional(),
  /** Tìm theo tên bộ từ. */
  q: z.string().trim().max(LIST_SEARCH_MAX_LENGTH).optional(),
  /** `due`: bỏ lỡ trước rồi hạn gần nhất (mặc định); `-createdAt`: mới giao trước. */
  sort: z.enum(['due', '-createdAt']).catch('due').default('due'),
});
export type MyAssignmentListQuery = z.infer<typeof myAssignmentListQuerySchema>;

/**
 * Trạng thái bài của học sinh theo bài nộp (việc 5.12): chưa làm, đang làm (xong ít nhất một chế
 * độ), đã nộp đúng hạn, nộp trễ, bỏ lỡ (quá hạn chưa nộp).
 */
export const PROGRESS_STATUSES = ['todo', 'in_progress', 'submitted', 'late', 'missed'] as const;
export const progressStatusSchema = z.enum(PROGRESS_STATUSES);
export type ProgressStatus = z.infer<typeof progressStatusSchema>;

export const myAssignmentSchema = assignmentSchema.extend({
  className: z.string(),
  /** Trạng thái cũ theo phiên xong đầu tiên, giữ cho code cũ; dùng `progressStatus`. */
  status: assignmentStatusSchema,
  progressStatus: progressStatusSchema,
  modes: z.array(studyModeSchema),
  /** Số chế độ đã xong một phiên gắn bài. */
  doneModes: z.number().int(),
  /** Lần học xong đầu tiên sau khi được giao, `null` khi chưa làm. */
  completedAt: z.string().nullable(),
});
export type MyAssignment = z.infer<typeof myAssignmentSchema>;

export const myAssignmentListSchema = z.object({
  data: z.array(myAssignmentSchema),
  meta: paginationMetaSchema,
  /** Số bài từng nhóm sau khi lọc lớp và tìm, để hiện trên tab. */
  counts: z.object({ todo: z.number().int(), done: z.number().int(), all: z.number().int() }),
});
export type MyAssignmentList = z.infer<typeof myAssignmentListSchema>;

/** Tiến độ một chế độ của bài giao: đã xong một phiên chưa, điểm phiên tốt nhất (Flashcard không chấm). */
export const assignmentModeProgressSchema = z.object({
  mode: studyModeSchema,
  done: z.boolean(),
  score: z.number().int().nullable(),
});
export type AssignmentModeProgress = z.infer<typeof assignmentModeProgressSchema>;

export const submissionSchema = z.object({
  submittedAt: z.string(),
  /** Phần trăm chốt lúc nộp, `null` khi bài không có chế độ chấm điểm. */
  score: z.number().int().nullable(),
  late: z.boolean(),
});
export type Submission = z.infer<typeof submissionSchema>;

/** Điểm của lần học tốt nhất sau khi giao, `null` khi chưa làm. */
const resultScoreShape = {
  status: assignmentStatusSchema,
  completedAt: z.string().nullable(),
  correct: z.number().int().nullable(),
  total: z.number().int().nullable(),
};

export const assignmentResultListQuerySchema = paginationSchema.extend({
  /** Lọc theo trạng thái bài nộp (việc 5.17). */
  status: progressStatusSchema.optional(),
});
export type AssignmentResultListQuery = z.infer<typeof assignmentResultListQuerySchema>;

export const assignmentResultSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  ...resultScoreShape,
  /** Trạng thái theo bài nộp (việc 5.17); `status` cũ giữ cho code cũ. */
  progressStatus: progressStatusSchema,
  submission: submissionSchema.nullable(),
  /** Điểm tốt nhất từng chế độ theo thứ tự của bài, chỉ phiên gắn bài. */
  modeScores: z.array(assignmentModeProgressSchema),
});
export type AssignmentResult = z.infer<typeof assignmentResultSchema>;

export const assignmentResultListSchema = z.object({
  data: z.array(assignmentResultSchema),
  meta: paginationMetaSchema,
});
export type AssignmentResultList = z.infer<typeof assignmentResultListSchema>;

export const hardCardSchema = z.object({
  cardId: z.string(),
  term: z.string(),
  definition: z.string(),
  wrongCount: z.number().int(),
  attemptCount: z.number().int(),
});
export type HardCard = z.infer<typeof hardCardSchema>;

export const assignmentSummarySchema = z.object({
  memberCount: z.number().int(),
  doneCount: z.number().int(),
  overdueCount: z.number().int(),
  /** Đếm theo bài nộp (việc 5.17). */
  submittedCount: z.number().int(),
  lateCount: z.number().int(),
  missedCount: z.number().int(),
  /** Điểm trung bình theo phần trăm của học sinh đã làm, `null` khi chưa ai làm. */
  averageScore: z.number().nullable(),
  /** Tối đa 5 thẻ cả lớp sai nhiều nhất, thẻ chưa ai sai không có ở đây. */
  hardCards: z.array(hardCardSchema),
});
export type AssignmentSummary = z.infer<typeof assignmentSummarySchema>;

export const assignmentSummaryResponseSchema = z.object({ data: assignmentSummarySchema });

export const memberResultListQuerySchema = paginationSchema;

export const memberResultSchema = assignmentSchema.extend(resultScoreShape);
export type MemberResult = z.infer<typeof memberResultSchema>;

export const memberResultListSchema = z.object({
  data: z.array(memberResultSchema),
  meta: paginationMetaSchema,
});
export type MemberResultList = z.infer<typeof memberResultListSchema>;

export const myAssignmentDetailSchema = z.object({
  id: z.string(),
  classId: z.string(),
  className: z.string(),
  setId: z.string(),
  setTitle: z.string(),
  modes: z.array(studyModeSchema),
  dueAt: z.string().nullable(),
  createdAt: z.string(),
  progress: z.array(assignmentModeProgressSchema),
  submission: submissionSchema.nullable(),
  canSubmit: z.boolean(),
});
export type MyAssignmentDetail = z.infer<typeof myAssignmentDetailSchema>;
export const myAssignmentDetailResponseSchema = z.object({ data: myAssignmentDetailSchema });
export const submissionResponseSchema = z.object({ data: submissionSchema });

/** Một bài giao trong Tổng quan giáo viên: số đã nộp trên số học sinh phải làm (việc 5.19). */
export const overviewAssignmentSchema = z.object({
  assignmentId: z.string(),
  classId: z.string(),
  className: z.string(),
  setTitle: z.string(),
  dueAt: z.string().nullable(),
  submitted: z.number().int(),
  memberCount: z.number().int(),
});
export type OverviewAssignment = z.infer<typeof overviewAssignmentSchema>;

export const teacherOverviewSchema = z.object({
  classCount: z.number().int(),
  studentCount: z.number().int(),
  /** Học sinh vào lớp trong 7 ngày qua. */
  newStudents: z.number().int(),
  openAssignmentCount: z.number().int(),
  /** Bài chưa hết hạn, hạn trong 48 giờ tới. */
  dueSoonCount: z.number().int(),
  /** Phần trăm nộp đúng hạn 30 ngày qua, `null` khi chưa có bài nào hết hạn. */
  onTimeRate: z.number().int().nullable(),
  attention: z.object({
    /** Bài còn dưới 48 giờ mà dưới một nửa lớp đã nộp. */
    lowSubmissions: z.array(overviewAssignmentSchema),
    /** Học sinh bỏ lỡ từ 2 bài liên tiếp gần nhất trong 30 ngày. */
    missedStreaks: z.array(
      z.object({
        userId: z.string(),
        displayName: z.string(),
        classId: z.string(),
        className: z.string(),
        missed: z.number().int(),
      }),
    ),
  }),
  /** Tối đa 5 bài chưa hết hạn, hạn gần nhất trước. */
  upcoming: z.array(overviewAssignmentSchema),
  /** 10 bài nộp mới nhất của mọi lớp. */
  recentSubmissions: z.array(
    z.object({
      userId: z.string(),
      displayName: z.string(),
      classId: z.string(),
      className: z.string(),
      assignmentId: z.string(),
      setTitle: z.string(),
      score: z.number().int().nullable(),
      late: z.boolean(),
      submittedAt: z.string(),
    }),
  ),
});
export type TeacherOverview = z.infer<typeof teacherOverviewSchema>;
export const teacherOverviewResponseSchema = z.object({ data: teacherOverviewSchema });
