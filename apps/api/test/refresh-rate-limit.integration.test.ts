import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createTestApp } from './support/app';

// ConfigModule đọc env khi nạp AppModule, nên phải đặt trước mọi import.
const REFRESH_LIMIT = vi.hoisted(() => {
  process.env.RATE_LIMIT_REFRESH_PER_MINUTE = '5';
  return 5;
});

describe('RATE_LIMIT_REFRESH_PER_MINUTE', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.RATE_LIMIT_REFRESH_PER_MINUTE;
  });

  it('đổi được giới hạn làm mới phiên theo IP', async () => {
    const refresh = () =>
      app
        .getHttpAdapter()
        .getInstance()
        .inject({
          method: 'POST',
          url: '/api/v1/auth/refresh',
          headers: { 'x-forwarded-for': '203.0.113.30' },
        });
    for (let attempt = 0; attempt < REFRESH_LIMIT; attempt += 1) {
      expect((await refresh()).statusCode).toBe(401);
    }

    expect((await refresh()).statusCode).toBe(429);
  });
});
