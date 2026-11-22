import {
  imageSearchResponseSchema,
  presignedUploadSchema,
  uploadConfigSchema,
  type ImageContentType,
  type ImageSearchResultItem,
  type UploadConfig,
} from '@vocab/shared';
import { http } from '@/lib/http';

export const uploadKeys = {
  config: ['uploads', 'config'] as const,
};

export async function getUploadConfig(): Promise<UploadConfig> {
  const { data } = await http<{ data: unknown }>('/uploads/config');
  return uploadConfigSchema.parse(data);
}

/** Xin URL ký sẵn rồi tải ảnh thẳng lên kho ảnh, trả địa chỉ công khai để lưu vào thẻ. */
export async function uploadCardImage(file: File): Promise<string> {
  const { data } = await http<{ data: unknown }>('/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({ contentType: file.type as ImageContentType, size: file.size }),
  });
  const upload = presignedUploadSchema.parse(data);
  const response = await fetch(upload.uploadUrl, {
    method: 'PUT',
    headers: upload.headers,
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Tải ảnh lên thất bại (${response.status})`);
  }
  return upload.publicUrl;
}

/** Tìm ảnh trực tuyến theo từ khoá qua Unsplash hoặc Pixabay. */
export async function searchImages(query: string): Promise<ImageSearchResultItem[]> {
  const { data } = await http<{ data: unknown }>(
    `/uploads/search-images?query=${encodeURIComponent(query)}`,
  );
  return imageSearchResponseSchema.parse({ data }).data;
}
