import { z } from 'zod';

export const SET_TITLE_MAX_LENGTH = 200;
export const SET_DESCRIPTION_MAX_LENGTH = 2_000;
export const CARD_TERM_MAX_LENGTH = 200;
export const CARD_DEFINITION_MAX_LENGTH = 1_000;
export const MAX_CARDS_PER_SET = 2_000;

export const visibilitySchema = z.enum(['PRIVATE', 'CLASS', 'PUBLIC']);
export type Visibility = z.infer<typeof visibilitySchema>;

/** Một dòng, không có ký tự điều khiển. */
const lineSchema = (label: string, max: number) =>
  z
    .string(`Hãy nhập ${label}`)
    .trim()
    .min(1, `Hãy nhập ${label}`)
    .max(max, `${label} tối đa ${max} ký tự`)
    .regex(/^\P{Cc}+$/u, `${label} chứa ký tự không hợp lệ`);

/** Cho phép xuống dòng. PostgreSQL không lưu được ký tự NUL. */
const textSchema = (label: string, max: number) =>
  z
    .string(`Hãy nhập ${label}`)
    .trim()
    .max(max, `${label} tối đa ${max} ký tự`)
    .refine((value) => !value.includes('\u0000'), `${label} chứa ký tự không hợp lệ`);

const languageSchema = z
  .string()
  .trim()
  .max(35, 'Mã ngôn ngữ quá dài')
  .regex(/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/, 'Mã ngôn ngữ không hợp lệ');

const titleSchema = lineSchema('tên bộ từ', SET_TITLE_MAX_LENGTH);
const descriptionSchema = textSchema('mô tả', SET_DESCRIPTION_MAX_LENGTH);

export const cardInputSchema = z.object({
  term: lineSchema('thuật ngữ', CARD_TERM_MAX_LENGTH),
  definition: textSchema('định nghĩa', CARD_DEFINITION_MAX_LENGTH).min(1, 'Hãy nhập định nghĩa'),
  phonetic: lineSchema('phiên âm', CARD_TERM_MAX_LENGTH).optional(),
  example: textSchema('ví dụ', CARD_DEFINITION_MAX_LENGTH).optional(),
});
export type CardInput = z.infer<typeof cardInputSchema>;

export const createSetSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.optional(),
  termLang: languageSchema.default('en'),
  defLang: languageSchema.default('vi'),
  visibility: visibilitySchema.default('PRIVATE'),
  cards: z
    .array(cardInputSchema)
    .max(MAX_CARDS_PER_SET, `Một bộ từ tối đa ${MAX_CARDS_PER_SET} thẻ`)
    .default([]),
});

/** Dữ liệu sau khi parse (đã áp default). */
export type CreateSetDto = z.infer<typeof createSetSchema>;
/** Dữ liệu đầu vào từ form/client (các trường default là tuỳ chọn). */
export type CreateSetInput = z.input<typeof createSetSchema>;

export const updateSetSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.nullable().optional(),
    termLang: languageSchema.optional(),
    defLang: languageSchema.optional(),
    visibility: visibilitySchema.optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Chưa có thay đổi nào',
  });
export type UpdateSetDto = z.infer<typeof updateSetSchema>;
