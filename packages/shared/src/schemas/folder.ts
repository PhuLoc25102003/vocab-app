import { z } from 'zod';
import { vm } from '../validation';
import { paginationMetaSchema, paginationSchema } from './pagination';

export const FOLDER_NAME_MAX_LENGTH = 60;

const folderNameSchema = z
  .string(vm('required', { field: 'folderName' }))
  .trim()
  .min(1, vm('required', { field: 'folderName' }))
  .max(FOLDER_NAME_MAX_LENGTH, vm('tooLong', { field: 'folderName', max: FOLDER_NAME_MAX_LENGTH }))
  .regex(/^\P{Cc}+$/u, vm('badChars', { field: 'folderName' }));

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
