import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { REGISTER_LIMIT_PER_IP } from '../src/modules/auth/auth-throttler.guard';
import { createTestApp } from './support/app';
import { FakeRedis } from './support/fake-redis';

describe('rate limit dùng chung qua Redis', () => {
  const redis = new FakeRedis();
  const broken = new FakeRedis();
  let first: NestFastifyApplication;
  let second: NestFastifyApplication;
  let withBrokenRedis: NestFastifyApplication;

  // Guard chạy trước pipe, body rỗng vẫn bị tính lượt và trả 400.
  const register = (app: NestFastifyApplication, ip: string) =>
    app
      .getHttpAdapter()
      .getInstance()
      .inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        headers: { 'x-forwarded-for': ip },
        payload: {},
      });

  beforeAll(async () => {
    broken.failing = true;
    [first, second, withBrokenRedis] = await Promise.all([
      createTestApp({}, {}, { redis }),
      createTestApp({}, {}, { redis }),
      createTestApp({}, {}, { redis: broken }),
    ]);
  });

  afterAll(async () => {
    await Promise.all([first.close(), second.close(), withBrokenRedis.close()]);
  });

  it('hai instance cùng tính một giới hạn', async () => {
    const ip = '198.51.100.10';
    for (let attempt = 0; attempt < REGISTER_LIMIT_PER_IP; attempt += 1) {
      const app = attempt % 2 === 0 ? first : second;
      expect((await register(app, ip)).statusCode).toBe(400);
    }

    const blocked = await register(second, ip);
    expect(blocked.statusCode).toBe(429);
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
    expect((await register(first, ip)).statusCode).toBe(429);
    // IP khác không bị ảnh hưởng.
    expect((await register(first, '198.51.100.11')).statusCode).toBe(400);
  });

  it('Redis lỗi thì API vẫn chạy và đếm trong bộ nhớ', async () => {
    const ip = '198.51.100.20';
    for (let attempt = 0; attempt < REGISTER_LIMIT_PER_IP; attempt += 1) {
      expect((await register(withBrokenRedis, ip)).statusCode).toBe(400);
    }

    expect((await register(withBrokenRedis, ip)).statusCode).toBe(429);
  });
});
