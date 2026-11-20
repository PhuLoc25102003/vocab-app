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

export const classListQuerySchema = paginationSchema.extend({
  /** Mặc định chỉ trả lớp đang hoạt động. */
  archived: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
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

export const classListSchema = z.object({
  data: z.array(classSchema),
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

export const classMemberListQuerySchema = paginationSchema;

/** Giáo viên chỉ cần tên hiển thị để nhận ra học sinh, không lộ email. */
export const classMemberSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  joinedAt: z.string(),
});
export type ClassMember = z.infer<typeof classMemberSchema>;

export const classMemberResponseSchema = z.object({ data: classMemberSchema });

export const classMemberListSchema = z.object({
  data: z.array(classMemberSchema),
  meta: paginationMetaSchema,
});
export type ClassMemberList = z.infer<typeof classMemberListSchema>;

export const joinedClassListQuerySchema = paginationSchema;

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

export const MAX_ASSIGNMENT_MODES = 5;

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

export const assignmentListQuerySchema = paginationSchema;

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

export const assignmentListSchema = z.object({
  data: z.array(assignmentSchema),
  meta: paginationMetaSchema,
});
export type AssignmentList = z.infer<typeof assignmentListSchema>;

export const ASSIGNMENT_STATUSES = ['pending', 'done', 'overdue'] as const;
export const assignmentStatusSchema = z.enum(ASSIGNMENT_STATUSES);
export type AssignmentStatus = z.infer<typeof assignmentStatusSchema>;

export const myAssignmentListQuerySchema = paginationSchema;

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
});
export type MyAssignmentList = z.infer<typeof myAssignmentListSchema>;

/** Điểm của lần học tốt nhất sau khi giao, `null` khi chưa làm. */
const resultScoreShape = {
  status: assignmentStatusSchema,
  completedAt: z.string().nullable(),
  correct: z.number().int().nullable(),
  total: z.number().int().nullable(),
};

export const assignmentResultListQuerySchema = paginationSchema;

export const assignmentResultSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  ...resultScoreShape,
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
