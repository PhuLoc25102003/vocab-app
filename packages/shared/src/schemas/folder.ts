import { z } from 'zod';
import { paginationMetaSchema, paginationSchema } from './pagination';

export const FOLDER_NAME_MAX_LENGTH = 60;

const folderNameSchema = z
  .string('Hãy nhập tên thư mục')
  .trim()
  .min(1, 'Hãy nhập tên thư mục')
  .max(FOLDER_NAME_MAX_LENGTH, `Tên thư mục tối đa ${FOLDER_NAME_MAX_LENGTH} ký tự`)
  .regex(/^\P{Cc}+$/u, 'Tên thư mục chứa ký tự không hợp lệ');

export const folderInputSchema = z.object({ name: folderNameSchema });
export type FolderInput = z.infer<typeof folderInputSchema>;

export const folderListQuerySchema = paginationSchema;

export const folderSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Số bộ từ chưa xoá trong thư mục. */
  setCount: z.number(),
});
export type Folder = z.infer<typeof folderSchema>;

export const folderListSchema = z.object({
  data: z.array(folderSchema),
  meta: paginationMetaSchema,
});
export type FolderList = z.infer<typeof folderListSchema>;

export const folderResponseSchema = z.object({ data: folderSchema });
