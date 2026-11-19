import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES } from '@vocab/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { GUEST_REQUEST_LIMIT, USER_REQUEST_LIMIT } from '../src/common/guards/api-rate-limit.guard';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

describe('rate limit chung của API', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  const createToken = async (email: string) => {
    const user = await prisma.user.create({ data: { email, displayName: email } });
    return app.get(AccessTokenService).sign(user);
  };
  // Gọi thẳng vào Fastify, vì mở hàng trăm kết nối cùng lúc làm test không ổn định trên Windows.
  const get = (url: string, headers: Record<string, string> = {}) =>
    app.getHttpAdapter().getInstance().inject({ method: 'GET', url, headers });
  const me = (token: string) => get('/api/v1/users/me', { authorization: `Bearer ${token}` });
  const publicSets = (ip: string) => get('/api/v1/sets/public', { 'x-forwarded-for': ip });
  const expectAllowed = async (count: number, send: () => ReturnType<typeof get>) => {
    const responses = await Promise.all(Array.from({ length: count }, send));
    expect(responses.every(({ statusCode }) => statusCode === 200)).toBe(true);
  };

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('chặn người dùng vượt giới hạn, không ảnh hưởng người khác', async () => {
    const [busy, calm] = await Promise.all([
      createToken('busy@example.com'),
      createToken('calm@example.com'),
    ]);
    await expectAllowed(USER_REQUEST_LIMIT, () => me(busy));

    const blocked = await me(busy);

    expect(blocked.statusCode).toBe(429);
    expect(blocked.json().error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
    expect(blocked.headers['retry-after']).toBeDefined();
    expect((await me(calm)).statusCode).toBe(200);
  });

  it('tính khách theo IP', async () => {
    await expectAllowed(GUEST_REQUEST_LIMIT, () => publicSets('203.0.113.10'));

    expect((await publicSets('203.0.113.10')).statusCode).toBe(429);
    expect((await publicSets('203.0.113.11')).statusCode).toBe(200);
  });

  it('không giới hạn kiểm tra sức khoẻ', async () => {
    await expectAllowed(GUEST_REQUEST_LIMIT + 1, () =>
      get('/api/v1/health', { 'x-forwarded-for': '203.0.113.12' }),
    );
  });
});
