import { ERROR_CODES, type SetDetail } from '@vocab/shared';
import { cacheLife } from 'next/cache';
import { HttpError } from '@/lib/http';
import { getSet } from './api';

const PUBLIC_SET_CACHE_SECONDS = 300;
const CLIENT_CACHE_SECONDS = 60;

/**
 * Gọi như khách nên chỉ nhận được bộ từ công khai. `expire` bằng `revalidate` để
 * bộ từ vừa chuyển riêng tư không tiếp tục hiện sau thời gian cache.
 */
export async function getPublicSet(id: string): Promise<SetDetail | null> {
  'use cache';
  cacheLife({
    stale: CLIENT_CACHE_SECONDS,
    revalidate: PUBLIC_SET_CACHE_SECONDS,
    expire: PUBLIC_SET_CACHE_SECONDS,
  });

  try {
    return await getSet(id, { skipAuth: true });
  } catch (error) {
    if (error instanceof HttpError && error.code === ERROR_CODES.SET_NOT_FOUND) {
      return null;
    }
    throw error;
  }
}
