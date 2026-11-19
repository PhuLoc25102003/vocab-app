import { z } from 'zod';
import { cardInputSchema, MAX_CARDS_PER_SET, setSummarySchema } from './set';

/** Giới hạn nội dung nhập, tương đương file 2 MB. */
export const IMPORT_MAX_CHARS = 2_000_000;
/** Số cột tối đa được chọn làm cột từ hoặc cột nghĩa. */
export const IMPORT_MAX_COLUMN = 20;

export const importDelimiterSchema = z.enum(['auto', 'tab', 'comma', 'semicolon', 'dash']);
export type ImportDelimiter = z.infer<typeof importDelimiterSchema>;
export type DetectedDelimiter = Exclude<ImportDelimiter, 'auto'>;

const columnSchema = z.coerce
  .number()
  .int()
  .min(1, 'Cột bắt đầu từ 1')
  .max(IMPORT_MAX_COLUMN, `Cột tối đa là ${IMPORT_MAX_COLUMN}`);

/** Cột không bắt buộc, giá trị rỗng từ form nghĩa là không chọn. */
const optionalColumnSchema = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  columnSchema.optional(),
);

/** Thứ tự kiểm tra trùng cột, lỗi báo ở cột đứng sau. */
const DISTINCT_COLUMNS = [
  ['termColumn', ''],
  ['definitionColumn', 'Cột nghĩa phải khác cột từ'],
  ['phoneticColumn', 'Cột phiên âm phải khác cột từ và cột nghĩa'],
  ['exampleColumn', 'Cột ví dụ phải khác các cột đã chọn'],
] as const;

export const importOptionsSchema = z
  .object({
    delimiter: importDelimiterSchema.default('auto'),
    hasHeader: z.boolean().default(false),
    termColumn: columnSchema.default(1),
    definitionColumn: columnSchema.default(2),
    phoneticColumn: optionalColumnSchema,
    exampleColumn: optionalColumnSchema,
  })
  .superRefine((value, context) => {
    const used = new Set<number>();
    for (const [key, message] of DISTINCT_COLUMNS) {
      const column = value[key];
      if (column === undefined) continue;
      if (used.has(column)) context.addIssue({ code: 'custom', path: [key], message });
      used.add(column);
    }
  });
export type ImportOptions = z.infer<typeof importOptionsSchema>;

export const importPreviewSchema = z.object({
  content: z
    .string('Hãy dán nội dung hoặc chọn file')
    .max(IMPORT_MAX_CHARS, 'Nội dung tối đa 2 MB')
    .refine((value) => value.trim().length > 0, 'Hãy dán nội dung hoặc chọn file'),
  options: importOptionsSchema.default({
    delimiter: 'auto',
    hasHeader: false,
    termColumn: 1,
    definitionColumn: 2,
  }),
});
export type ImportPreviewDto = z.infer<typeof importPreviewSchema>;
export type ImportPreviewInput = z.input<typeof importPreviewSchema>;

export const importRowSchema = z.object({
  /** Số dòng trong nội dung gốc, bắt đầu từ 1. */
  line: z.number(),
  term: z.string(),
  definition: z.string(),
  /** Chỉ có khi chọn cột phiên âm. */
  phonetic: z.string().optional(),
  /** Chỉ có khi chọn cột ví dụ. */
  example: z.string().optional(),
  errors: z.array(z.string()),
});
export type ImportRow = z.infer<typeof importRowSchema>;

export const importPreviewResultSchema = z.object({
  delimiter: importDelimiterSchema.exclude(['auto']),
  columnCount: z.number(),
  rows: z.array(importRowSchema),
});
export type ImportPreviewResult = z.infer<typeof importPreviewResultSchema>;

export const importPreviewResponseSchema = z.object({ data: importPreviewResultSchema });

/** Thẻ đã xem trước và sửa trên web, được thêm vào cuối bộ từ có sẵn. */
export const importCardsSchema = z.object({
  cards: z
    .array(cardInputSchema)
    .min(1, 'Chưa có thẻ nào để nhập')
    .max(MAX_CARDS_PER_SET, `Mỗi lần nhập tối đa ${MAX_CARDS_PER_SET} thẻ`),
});
export type ImportCardsDto = z.infer<typeof importCardsSchema>;

export const importCardsResultSchema = z.object({
  data: setSummarySchema.extend({ imported: z.number() }),
});
