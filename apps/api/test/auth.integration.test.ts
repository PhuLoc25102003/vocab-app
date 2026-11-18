import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const account = { email: 'an@example.com', password: 'mat-khau-dai', displayName: 'An' };

describe('auth', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let ipCounter = 0;
  let ip: string;

  const nextIp = () => {
    ipCounter += 1;
    return `10.0.${Math.floor(ipCounter / 250)}.${(ipCounter % 250) + 1}`;
  };
  const post = (path: string, body: object, from = ip) =>
    request(app.getHttpServer())
      .post(`/api/v1/auth/${path}`)
      .set('X-Forwarded-For', from)
      .send(body);

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    // Mỗi test dùng IP riêng để không đụng giới hạn của test khác.
    ip = nextIp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('lưu mật khẩu dạng argon2id và không nhận role từ client', async () => {
      const response = await post('register', {
        ...account,
        email: ' AN@Example.com ',
        role: 'ADMIN',
      }).expect(202);

      expect(response.body).toEqual({ data: { status: 'accepted' } });
      const user = await prisma.user.findUniqueOrThrow({ where: { email: account.email } });
      expect(user.role).toBe('STUDENT');
      expect(user.passwordHash).toMatch(/^\$argon2id\$/);
    });

    it('trả cùng kết quả khi email đã có và giữ nguyên tài khoản cũ', async () => {
      const first = await post('register', account).expect(202);
      const before = await prisma.user.findUniqueOrThrow({ where: { email: account.email } });

      const second = await post('register', {
        ...account,
        password: 'mat-khau-khac',
        displayName: 'Người khác',
      }).expect(202);

      expect(second.body).toEqual(first.body);
      const after = await prisma.user.findUniqueOrThrow({ where: { email: account.email } });
      expect(after).toEqual(before);
    });

    it('chỉ tạo một tài khoản khi đăng ký đồng thời', async () => {
      const responses = await Promise.all([post('register', account), post('register', account)]);

      expect(responses.map(({ status }) => status)).toEqual([202, 202]);
      expect(await prisma.user.count()).toBe(1);
    });

    it('trả 400 và không lặp lại mật khẩu khi dữ liệu sai', async () => {
      const response = await post('register', { ...account, password: 'qx7-z' }).expect(400);

      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(response.body.error.details[0].path).toBe('password');
      expect(response.text).not.toContain('qx7-z');
      expect(await prisma.user.count()).toBe(0);
    });

    it('trả 429 từ lần thứ 4 trong một phút trên cùng IP', async () => {
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        await post('register', { ...account, email: `u${attempt}@example.com` }).expect(202);
      }

      const body = { ...account, email: 'u4@example.com' };
      const response = await post('register', body).expect(429);

      expect(response.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
      expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
      await post('register', body, nextIp()).expect(202);
    });
  });
});
