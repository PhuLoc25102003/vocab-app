import { describe, expect, it } from 'vitest';
import { HttpError } from './http';
import { shouldRetryQuery } from './query-client';

describe('shouldRetryQuery', () => {
  it('không thử lại lỗi do request', () => {
    expect(shouldRetryQuery(0, new HttpError('Sai', 401, 'UNAUTHORIZED'))).toBe(false);
    expect(shouldRetryQuery(0, new HttpError('Không có', 404, 'NOT_FOUND'))).toBe(false);
  });

  it('thử lại lỗi mạng và lỗi máy chủ tối đa 2 lần', () => {
    expect(shouldRetryQuery(0, new TypeError('Failed to fetch'))).toBe(true);
    expect(shouldRetryQuery(1, new HttpError('Lỗi', 503, 'SERVICE_UNAVAILABLE'))).toBe(true);
    expect(shouldRetryQuery(2, new TypeError('Failed to fetch'))).toBe(false);
  });

  it('thử lại khi bị giới hạn tốc độ', () => {
    expect(shouldRetryQuery(0, new HttpError('Nhiều', 429, 'TOO_MANY_REQUESTS'))).toBe(true);
  });
});
