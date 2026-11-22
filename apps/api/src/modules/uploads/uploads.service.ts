import { randomUUID } from 'node:crypto';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ERROR_CODES,
  IMAGE_CONTENT_TYPES,
  IMAGE_MAX_BYTES,
  type CardInput,
  type ImageContentType,
  type PresignImageInput,
} from '@vocab/shared';
import { ok } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import type { Env } from '../../config/env';
import { OBJECT_STORAGE, type ObjectStorage } from '../../infrastructure/storage/object-storage';

const PRESIGN_TTL_SECONDS = 300;
const CARD_IMAGE_PREFIX = 'cards';
const EXTENSIONS: Record<ImageContentType, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

@Injectable()
export class UploadsService {
  constructor(
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage | null,
    private readonly config: ConfigService<Env, true>,
  ) {}

  getConfig() {
    const unsplash = Boolean(this.config.get('UNSPLASH_ACCESS_KEY', { infer: true }));
    const pixabay = Boolean(this.config.get('PIXABAY_API_KEY', { infer: true }));
    return ok({
      images: this.storage !== null,
      imageSearch: unsplash || pixabay,
      maxBytes: IMAGE_MAX_BYTES,
      contentTypes: [...IMAGE_CONTENT_TYPES],
    });
  }

  presignImage(userId: string, { contentType, size }: PresignImageInput) {
    if (!this.storage) {
      throw new AppError(
        ERROR_CODES.UPLOADS_DISABLED,
        'Chưa bật tải ảnh lên. Hãy thử lại sau.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const key = `${CARD_IMAGE_PREFIX}/${userId}/${randomUUID()}.${EXTENSIONS[contentType]}`;
    const upload = this.storage.presignPut({
      key,
      contentType,
      size,
      expiresInSeconds: PRESIGN_TTL_SECONDS,
    });
    return ok({ ...upload, expiresAt: new Date(Date.now() + PRESIGN_TTL_SECONDS * 1000) });
  }

  async searchImages(query: string) {
    const term = query.trim();
    if (!term) {
      return ok([]);
    }

    const unsplashKey = this.config.get('UNSPLASH_ACCESS_KEY', { infer: true });
    const pixabayKey = this.config.get('PIXABAY_API_KEY', { infer: true });

    if (unsplashKey) {
      try {
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(term)}&per_page=12&orientation=landscape`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Client-ID ${unsplashKey}`,
            'Accept-Version': 'v1',
          },
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          const body = (await res.json()) as {
            results?: Array<{
              id: string;
              urls?: { regular?: string; small?: string; thumb?: string };
              alt_description?: string | null;
              description?: string | null;
              user?: { name?: string; links?: { html?: string } };
            }>;
          };

          const items = (body.results ?? []).map((photo) => ({
            id: photo.id,
            thumbUrl: photo.urls?.small || photo.urls?.thumb || '',
            imageUrl: photo.urls?.regular || photo.urls?.small || '',
            alt: photo.alt_description || photo.description || term,
            authorName: photo.user?.name || 'Unsplash Creator',
            authorUrl: photo.user?.links?.html || 'https://unsplash.com',
            source: 'unsplash' as const,
          }));

          return ok(items);
        }
      } catch {
        // Fallback sang Pixabay nếu có lỗi hoặc hết lượt
      }
    }

    if (pixabayKey) {
      try {
        const url = `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(term)}&image_type=all&per_page=12&safesearch=true`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const body = (await res.json()) as {
            hits?: Array<{
              id: number;
              previewURL?: string;
              webformatURL?: string;
              largeImageURL?: string;
              tags?: string;
              user?: string;
              user_id?: number;
            }>;
          };

          const items = (body.hits ?? []).map((hit) => ({
            id: String(hit.id),
            thumbUrl: hit.previewURL || hit.webformatURL || '',
            imageUrl: hit.webformatURL || hit.largeImageURL || '',
            alt: hit.tags || term,
            authorName: hit.user || 'Pixabay Creator',
            authorUrl: hit.user
              ? `https://pixabay.com/users/${hit.user}-${hit.user_id || 0}/`
              : 'https://pixabay.com',
            source: 'pixabay' as const,
          }));

          return ok(items);
        }
      } catch {
        // Bỏ qua lỗi tìm kiếm ngoài
      }
    }

    return ok([]);
  }

  /**
   * Thẻ chỉ được trỏ tới ảnh trong kho của app, hoặc các nguồn ảnh trực tuyến hợp lệ (Unsplash, Pixabay).
   * Dùng `R2_PUBLIC_URL` thay vì kho đang bật, để tắt tải ảnh rồi vẫn lưu được thẻ có ảnh cũ.
   */
  assertCardImages(cards: readonly Pick<CardInput, 'imageUrl'>[]): void {
    const base = this.config.get('R2_PUBLIC_URL', { infer: true }).replace(/\/$/, '');
    const prefix = base ? `${base}/${CARD_IMAGE_PREFIX}/` : null;
    const isAllowed = (url: string) => {
      if (url.includes('..')) return false;
      if (prefix && url.startsWith(prefix)) return true;
      if (url.startsWith('https://images.unsplash.com/')) return true;
      if (url.startsWith('https://pixabay.com/') || url.startsWith('https://cdn.pixabay.com/'))
        return true;
      return false;
    };
    const invalid = cards.flatMap(({ imageUrl }, index) =>
      imageUrl && !isAllowed(imageUrl)
        ? [
            {
              path: `cards.${index}.imageUrl`,
              message: 'Ảnh không thuộc kho ảnh của Nhớ Từ hoặc nguồn ảnh hỗ trợ',
            },
          ]
        : [],
    );
    if (invalid.length > 0) {
      throw new AppError(
        ERROR_CODES.CARD_IMAGE_INVALID,
        'Có ảnh không hợp lệ. Hãy tải ảnh lên lại.',
        HttpStatus.BAD_REQUEST,
        invalid,
      );
    }
  }
}
