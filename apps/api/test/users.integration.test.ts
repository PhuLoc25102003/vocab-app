import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const account = { email: 'an@example.com', password: 'mat-khau-dai', displayName: 'An' };
const newPassword = 'mat-khau-moi-dai';

describe('tài khoản', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let ipCounter = 0;
  let ip: string;
  let accessToken: string;
  let refreshToken: string;

  const server = () => request(app.getHttpServer());
  const auth = (path: string) => server().post(`/api/v1/auth/${path}`).set('X-Forwarded-For', ip);
  const me = (method: 'get' | 'patch' | 'delete', token = accessToken) =>
    server()[method]('/api/v1/users/me').set('Authorization', `Bearer ${token}`);
  const refreshCookie = (headers: Record<string, unknown>) => {
    const cookies = (headers['set-cookie'] as string[] | undefined) ?? [];
    const cookie = cookies.find((value) => value.startsWith('refresh_token=')) ?? '';
    return cookie.slice('refresh_token='.length, cookie.indexOf(';'));
  };
  const login = async (password = account.password) => {
    const response = await auth('login').send({ email: account.email, password }).expect(200);
    return {
      accessToken: response.body.data.accessToken as string,
      refreshToken: refreshCookie(response.headers),
    };
  };
  const refresh = (token: string) => auth('refresh').set('Cookie', `refresh_token=${token}`);

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    ipCounter += 1;
    ip = `10.3.0.${ipCounter}`;
    await auth('register').send(account).expect(202);
    ({ accessToken, refreshToken } = await login());
  });

  afterAll(async () => {
    await app.close();
  });

  it('cần đăng nhập', async () => {
    await server().get('/api/v1/users/me').expect(401);
    await server().patch('/api/v1/users/me').send({ displayName: 'B' }).expect(401);
    await server().delete('/api/v1/users/me').send({}).expect(401);
  });

  it('GET /users/me trả thông tin tài khoản, không có dữ liệu nhạy cảm', async () => {
    const response = await me('get').expect(200);

    expect(response.body).toEqual({
      data: {
        user: {
          id: expect.any(String),
          email: account.email,
          displayName: 'An',
          role: 'STUDENT',
        },
      },
    });
  });

  describe('PATCH /users/me', () => {
    it('sửa tên, giữ nguyên phiên và không nhận email hay role', async () => {
      const response = await me('patch')
        .send({ displayName: '  Bình  ', role: 'ADMIN', email: 'x@example.com' })
        .expect(200);

      expect(response.body.data.user).toMatchObject({
        displayName: 'Bình',
        role: 'STUDENT',
        email: account.email,
      });
      expect(response.body.data).not.toHaveProperty('accessToken');
      await me('get').expect(200);
    });

    it.each([
      ['không có thay đổi', {}],
      ['mật khẩu mới thiếu mật khẩu hiện tại', { newPassword }],
      ['mật khẩu mới quá ngắn', { currentPassword: account.password, newPassword: 'ngan' }],
    ])('trả 400 khi %s', async (_name, body) => {
      const response = await me('patch').send(body).expect(400);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('trả 422 và không đổi gì khi mật khẩu hiện tại sai', async () => {
      const response = await me('patch')
        .send({ currentPassword: 'sai-mat-khau', newPassword, displayName: 'Bình' })
        .expect(422);

      expect(response.body.error.code).toBe(ERROR_CODES.WRONG_PASSWORD);
      expect((await me('get').expect(200)).body.data.user.displayName).toBe('An');
      await login();
    });

    it('đổi mật khẩu kết thúc mọi phiên cũ và cấp phiên mới', async () => {
      const otherDevice = await login();

      const response = await me('patch')
        .send({ currentPassword: account.password, newPassword })
        .expect(200);

      await me('get', accessToken).expect(401);
      await me('get', otherDevice.accessToken).expect(401);
      await refresh(refreshToken).expect(401);
      await refresh(otherDevice.refreshToken).expect(401);
      await me('get', response.body.data.accessToken as string).expect(200);
      await refresh(refreshCookie(response.headers)).expect(200);
      await auth('login').send({ email: account.email, password: account.password }).expect(401);
      await login(newPassword);
    });

    it('giới hạn 5 lần mỗi phút cho mỗi tài khoản', async () => {
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        await me('patch')
          .send({ displayName: `Tên ${attempt}` })
          .expect(200);
      }

      const response = await me('patch').send({ displayName: 'Tên 6' }).expect(429);

      expect(response.body.error.code).toBe(ERROR_CODES.TOO_MANY_REQUESTS);
    });
  });

  describe('DELETE /users/me', () => {
    it('trả 422 và giữ tài khoản khi mật khẩu sai hoặc thiếu', async () => {
      await me('delete').send({ password: 'sai-mat-khau' }).expect(422);
      await me('delete').send({}).expect(422);

      expect(await prisma.user.count()).toBe(1);
    });

    it('xoá hẳn tài khoản và dữ liệu, không đụng người dùng khác', async () => {
      const user = await prisma.user.findUniqueOrThrow({ where: { email: account.email } });
      const other = await prisma.user.create({
        data: { email: 'b@example.com', displayName: 'B' },
      });
      const mine = await prisma.studySet.create({ data: { ownerId: user.id, title: 'Của tôi' } });
      const theirs = await prisma.studySet.create({ data: { ownerId: other.id, title: 'Khác' } });
      await prisma.studySession.create({
        data: { userId: user.id, setId: theirs.id, mode: 'FLASHCARD' },
      });

      const response = await me('delete').send({ password: account.password }).expect(204);

      expect(response.headers['set-cookie']?.[0]).toMatch(/Expires=Thu, 01 Jan 1970/i);
      expect(await prisma.user.findUnique({ where: { id: user.id } })).toBeNull();
      expect(await prisma.studySet.findUnique({ where: { id: mine.id } })).toBeNull();
      expect(await prisma.refreshSession.count()).toBe(0);
      expect(await prisma.studySession.count()).toBe(0);
      expect(await prisma.studySet.findUnique({ where: { id: theirs.id } })).not.toBeNull();
      await me('get').expect(401);
      await refresh(refreshToken).expect(401);
    });

    it('tài khoản không có mật khẩu xoá được mà không cần xác nhận', async () => {
      await prisma.user.update({ where: { email: account.email }, data: { passwordHash: null } });

      await me('delete').send({}).expect(204);

      expect(await prisma.user.count()).toBe(0);
    });
  });
});
