import { z } from 'zod';
import { vm } from '../validation';
import { paginationMetaSchema, paginationSchema } from './pagination';

export const SET_TITLE_MAX_LENGTH = 200;
export const SET_DESCRIPTION_MAX_LENGTH = 2_000;
export const CARD_TERM_MAX_LENGTH = 200;
export const CARD_DEFINITION_MAX_LENGTH = 1_000;
export const MAX_CARDS_PER_SET = 2_000;

export const visibilitySchema = z.enum(['PRIVATE', 'CLASS', 'PUBLIC']);
export type Visibility = z.infer<typeof visibilitySchema>;

/** Một dòng, không có ký tự điều khiển. */
const lineSchema = (field: string, max: number) =>
  z
    .string(vm('required', { field }))
    .trim()
    .min(1, vm('required', { field }))
    .max(max, vm('tooLong', { field, max }))
    .regex(/^\P{Cc}+$/u, vm('badChars', { field }));

/** Cho phép xuống dòng. PostgreSQL không lưu được ký tự NUL. */
const textSchema = (field: string, max: number) =>
  z
    .string(vm('required', { field }))
    .trim()
    .max(max, vm('tooLong', { field, max }))
    .refine((value) => !value.includes('\u0000'), vm('badChars', { field }));

const languageSchema = z
  .string()
  .trim()
  .max(35, vm('langTooLong'))
  .regex(/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/, vm('langInvalid'));

const titleSchema = lineSchema('setTitle', SET_TITLE_MAX_LENGTH);
const descriptionSchema = textSchema('description', SET_DESCRIPTION_MAX_LENGTH);

export const cardInputSchema = z.object({
  term: lineSchema('term', CARD_TERM_MAX_LENGTH),
  definition: textSchema('definition', CARD_DEFINITION_MAX_LENGTH).min(
    1,
    vm('required', { field: 'definition' }),
  ),
  phonetic: lineSchema('phonetic', CARD_TERM_MAX_LENGTH).optional(),
  example: textSchema('example', CARD_DEFINITION_MAX_LENGTH).optional(),
  /** Ảnh đã tải lên qua `POST /uploads/presign` hoặc chọn từ Unsplash / Pixabay. */
  imageUrl: z.url(vm('imageUrlInvalid')).max(2000, vm('imageUrlTooLong')).nullable().optional(),
});
export type CardInput = z.infer<typeof cardInputSchema>;

export const createSetSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.optional(),
  termLang: languageSchema.default('en'),
  defLang: languageSchema.default('vi'),
  visibility: visibilitySchema.default('PRIVATE'),
  folderId: z.string().min(1).max(64).nullable().optional(),
  cards: z
    .array(cardInputSchema)
    .max(MAX_CARDS_PER_SET, vm('tooManyCards', { max: MAX_CARDS_PER_SET }))
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
    .max(MAX_CARDS_PER_SET, vm('tooManyCards', { max: MAX_CARDS_PER_SET }))
    .superRefine((cards, context) => {
      const seen = new Set<string>();
      cards.forEach(({ id }, index) => {
        if (id && seen.has(id)) {
          context.addIssue({
            code: 'custom',
            path: [index, 'id'],
            message: vm('duplicateCard'),
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
  q: z
    .string()
    .trim()
    .max(100, vm('keywordTooLong', { max: 100 }))
    .optional(),
});
export type PublicSetQuery = z.infer<typeof publicSetQuerySchema>;

/** `folderId` là id thư mục, hoặc `none` để lấy bộ chưa vào thư mục nào. */
export const mySetQuerySchema = publicSetQuerySchema.extend({
  folderId: z.string().min(1).max(64).optional(),
  visibility: visibilitySchema.optional(),
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
    message: vm('noChanges'),
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
