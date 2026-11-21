import { z } from 'zod';
import { vm } from '../validation';

export const IMAGE_MAX_BYTES = 1024 * 1024;
export const IMAGE_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type ImageContentType = (typeof IMAGE_CONTENT_TYPES)[number];

export const presignImageSchema = z.object({
  contentType: z.enum(IMAGE_CONTENT_TYPES, vm('imageType')),
  size: z
    .number(vm('imageSizeMissing'))
    .int()
    .min(1, vm('imageEmpty'))
    .max(IMAGE_MAX_BYTES, vm('imageTooLarge')),
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
