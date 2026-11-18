import { z } from 'zod';

export const visibilitySchema = z.enum(['PRIVATE', 'CLASS', 'PUBLIC']);
export type Visibility = z.infer<typeof visibilitySchema>;

export const createSetSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  termLang: z.string().trim().min(2).max(10).default('en'),
  defLang: z.string().trim().min(2).max(10).default('vi'),
  visibility: visibilitySchema.default('PRIVATE'),
  folderId: z.string().min(1).optional(),
});

/** Dữ liệu sau khi parse (đã áp default). */
export type CreateSetDto = z.infer<typeof createSetSchema>;
/** Dữ liệu đầu vào từ form/client (các trường default là tuỳ chọn). */
export type CreateSetInput = z.input<typeof createSetSchema>;
