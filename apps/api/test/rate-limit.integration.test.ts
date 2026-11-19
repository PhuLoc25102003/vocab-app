import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES } from '@vocab/shared';
import request from 'supertest';
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
  const server = () => request(app.getHttpServer());
  const me = (token: string) =>
    server().get('/api/v1/users/me').set('Authorization', `Bearer ${token}`);
  const publicSets = (ip: string) => server().get('/api/v1/sets/public').set('X-Forwarded-For', ip);
  const repeat = (count: number, send: () => PromiseLike<unknown>) =>
    Promise.all(Array.from({ length: count }, () => send()));

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
    await repeat(USER_REQUEST_LIMIT, () => me(busy).expect(200));

    const { body, headers } = await me(busy).expect(429);

    expect(body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
    expect(headers['retry-after']).toBeDefined();
    await me(calm).expect(200);
  });

  it('tính khách theo IP', async () => {
    await repeat(GUEST_REQUEST_LIMIT, () => publicSets('203.0.113.10').expect(200));

    await publicSets('203.0.113.10').expect(429);
    await publicSets('203.0.113.11').expect(200);
  });

  it('không giới hạn kiểm tra sức khoẻ', async () => {
    await repeat(GUEST_REQUEST_LIMIT + 1, () =>
      server().get('/api/v1/health').set('X-Forwarded-For', '203.0.113.12').expect(200),
    );
  });
});
