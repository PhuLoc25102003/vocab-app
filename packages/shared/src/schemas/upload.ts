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
  imageSearch: z.boolean().default(false),
  maxBytes: z.number(),
  contentTypes: z.array(z.enum(IMAGE_CONTENT_TYPES)),
});
export type UploadConfig = z.infer<typeof uploadConfigSchema>;

export const imageSearchResultItemSchema = z.object({
  id: z.string(),
  thumbUrl: z.url(),
  imageUrl: z.url(),
  alt: z.string(),
  authorName: z.string(),
  authorUrl: z.url(),
  source: z.enum(['unsplash', 'pixabay']),
});
export type ImageSearchResultItem = z.infer<typeof imageSearchResultItemSchema>;

export const imageSearchResponseSchema = z.object({
  data: z.array(imageSearchResultItemSchema),
});
export type ImageSearchResponse = z.infer<typeof imageSearchResponseSchema>;
