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
    return ok({
      images: this.storage !== null,
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

  /**
   * Thẻ chỉ được trỏ tới ảnh trong kho của app, để không nhúng ảnh từ nơi khác vào trang người học.
   * Dùng `R2_PUBLIC_URL` thay vì kho đang bật, để tắt tải ảnh rồi vẫn lưu được thẻ có ảnh cũ.
   */
  assertCardImages(cards: readonly Pick<CardInput, 'imageUrl'>[]): void {
    const base = this.config.get('R2_PUBLIC_URL', { infer: true }).replace(/\/$/, '');
    const prefix = `${base}/${CARD_IMAGE_PREFIX}/`;
    const invalid = cards.flatMap(({ imageUrl }, index) =>
      imageUrl && (!base || !imageUrl.startsWith(prefix) || imageUrl.includes('..'))
        ? [{ path: `cards.${index}.imageUrl`, message: 'Ảnh không thuộc kho ảnh của Nhớ Từ' }]
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
