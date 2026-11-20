import { z } from 'zod';
import { paginationMetaSchema, paginationSchema } from './pagination';

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
  /** Ảnh đã tải lên qua `POST /uploads/presign`. API chỉ nhận địa chỉ thuộc kho ảnh của app. */
  imageUrl: z.url('Địa chỉ ảnh không hợp lệ').max(500, 'Địa chỉ ảnh quá dài').nullable().optional(),
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

export const setSummarySchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  termLang: z.string(),
  defLang: z.string(),
  visibility: visibilitySchema,
  /** Thư mục của chủ bộ từ, chỉ có trong dữ liệu trả cho chủ. */
  folderId: z.string().nullable().optional(),
  cardCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SetSummary = z.infer<typeof setSummarySchema>;

export const setListSchema = z.object({
  data: z.array(setSummarySchema),
  meta: paginationMetaSchema,
});
export type SetList = z.infer<typeof setListSchema>;

export const publicSetSummarySchema = setSummarySchema.extend({
  owner: z.object({ displayName: z.string() }),
});
export type PublicSetSummary = z.infer<typeof publicSetSummarySchema>;

export const publicSetListSchema = setListSchema.extend({
  data: z.array(publicSetSummarySchema),
});
export type PublicSetList = z.infer<typeof publicSetListSchema>;

/** Thẻ có `id` là thẻ đang có, thẻ không có `id` là thẻ mới. Thứ tự trong mảng là thứ tự thẻ. */
export const replaceCardsSchema = z.object({
  cards: z
    .array(cardInputSchema.extend({ id: z.string().min(1).max(64).optional() }))
    .max(MAX_CARDS_PER_SET, `Một bộ từ tối đa ${MAX_CARDS_PER_SET} thẻ`)
    .superRefine((cards, context) => {
      const seen = new Set<string>();
      cards.forEach(({ id }, index) => {
        if (id && seen.has(id)) {
          context.addIssue({
            code: 'custom',
            path: [index, 'id'],
            message: 'Thẻ bị trùng trong danh sách',
          });
        }
        if (id) {
          seen.add(id);
        }
      });
    }),
});
export type ReplaceCardsDto = z.infer<typeof replaceCardsSchema>;

export const publicSetQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(100, 'Từ khoá tối đa 100 ký tự').optional(),
});
export type PublicSetQuery = z.infer<typeof publicSetQuerySchema>;

/** `folderId` là id thư mục, hoặc `none` để lấy bộ chưa vào thư mục nào. */
export const mySetQuerySchema = publicSetQuerySchema.extend({
  folderId: z.string().min(1).max(64).optional(),
});
export type MySetQuery = z.infer<typeof mySetQuerySchema>;

export const NO_FOLDER = 'none';

export const updateSetSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.nullable().optional(),
    termLang: languageSchema.optional(),
    defLang: languageSchema.optional(),
    visibility: visibilitySchema.optional(),
    /** `null` để đưa bộ từ ra khỏi thư mục. */
    folderId: z.string().min(1).max(64).nullable().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Chưa có thay đổi nào',
  });
export type UpdateSetDto = z.infer<typeof updateSetSchema>;

/**
 * Một dòng thẻ trong form. Dòng mới để trống hoàn toàn được bỏ qua.
 * Thẻ đã có không được để trống, vì bỏ qua đồng nghĩa với xoá cả tiến độ học.
 */
const cardDraftSchema = z
  .object({
    id: z.string().optional(),
    term: z.string(),
    definition: z.string(),
    phonetic: z.string(),
    example: z.string(),
    /** `null` là đã gỡ ảnh, bỏ trống là thẻ chưa từng có ảnh. */
    imageUrl: z.string().nullable().optional(),
  })
  .transform(({ id, term, definition, phonetic, example, imageUrl }, context) => {
    const optional = {
      phonetic: phonetic.trim() || undefined,
      example: example.trim() || undefined,
    };
    const isBlank =
      !term.trim() && !definition.trim() && !optional.phonetic && !optional.example && !imageUrl;
    if (!id && isBlank) {
      return null;
    }
    const card = cardInputSchema.safeParse({
      term,
      definition,
      ...optional,
      ...(imageUrl === undefined ? {} : { imageUrl }),
    });
    if (!card.success) {
      card.error.issues.forEach(({ path, message }) =>
        context.addIssue({ code: 'custom', path, message }),
      );
      return z.NEVER;
    }
    return { ...card.data, ...(id ? { id } : {}) };
  });

/** Dữ liệu của form bộ từ. Mô tả để trống nghĩa là không có mô tả. */
export const setFormSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  termLang: languageSchema,
  defLang: languageSchema,
  visibility: visibilitySchema,
  cards: z
    .array(cardDraftSchema)
    .transform((cards) => cards.filter((card) => card !== null))
    .pipe(replaceCardsSchema.shape.cards),
});
export type SetFormInput = z.input<typeof setFormSchema>;
export type SetFormValues = z.output<typeof setFormSchema>;
export type CardDraft = SetFormInput['cards'][number];

export const cardSchema = z.object({
  id: z.string(),
  position: z.number(),
  term: z.string(),
  definition: z.string(),
  phonetic: z.string().nullable(),
  example: z.string().nullable(),
  imageUrl: z.string().nullable(),
  audioUrl: z.string().nullable(),
});
export type Card = z.infer<typeof cardSchema>;

export const setDetailSchema = setSummarySchema.extend({
  owner: z.object({ displayName: z.string() }),
  cards: z.array(cardSchema),
  /** ADMIN đã ẩn bộ vi phạm. Chỉ chủ bộ và ADMIN xem được bộ đang bị ẩn. */
  hiddenAt: z.coerce.date().nullable().optional(),
  hiddenReason: z.string().nullable().optional(),
});
export type SetDetail = z.infer<typeof setDetailSchema>;

export const setResponseSchema = z.object({ data: setSummarySchema });
export const setDetailResponseSchema = z.object({ data: setDetailSchema });
