import { z } from 'zod';
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
