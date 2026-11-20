import { z } from 'zod';

export const IMAGE_MAX_BYTES = 1024 * 1024;
export const IMAGE_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type ImageContentType = (typeof IMAGE_CONTENT_TYPES)[number];

export const presignImageSchema = z.object({
  contentType: z.enum(IMAGE_CONTENT_TYPES, 'Chỉ nhận ảnh PNG, JPEG hoặc WebP'),
  size: z
    .number('Thiếu dung lượng ảnh')
    .int()
    .min(1, 'Ảnh rỗng')
    .max(IMAGE_MAX_BYTES, 'Ảnh tối đa 1 MB'),
});
export type PresignImageInput = z.infer<typeof presignImageSchema>;

/** Trình duyệt `PUT` tệp lên `uploadUrl` kèm `headers`, rồi lưu `publicUrl` vào thẻ. */
export const presignedUploadSchema = z.object({
  uploadUrl: z.url(),
  headers: z.record(z.string(), z.string()),
  publicUrl: z.url(),
  expiresAt: z.coerce.date(),
});
export type PresignedUpload = z.infer<typeof presignedUploadSchema>;

export const uploadConfigSchema = z.object({
  images: z.boolean(),
  maxBytes: z.number(),
  contentTypes: z.array(z.enum(IMAGE_CONTENT_TYPES)),
});
export type UploadConfig = z.infer<typeof uploadConfigSchema>;
