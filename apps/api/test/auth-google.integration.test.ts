import type { ConfigService } from '@nestjs/config';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES } from '@vocab/shared';
import { OAuth2Client, type LoginTicket, type TokenPayload } from 'google-auth-library';
import request from 'supertest';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';
import type { Env } from '../src/config/env';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { GoogleIdentityService } from '../src/modules/auth/google-identity.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const GOOGLE_USER = {
  sub: 'google-sub-1',
  email: 'an@example.com',
  email_verified: true,
  name: 'An Nguyễn',
};

describe('POST /auth/google', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let verifyIdToken: MockInstance;
  let ipCounter = 0;
  let ip: string;

  const signInWith = (payload: Partial<TokenPayload>) => {
    verifyIdToken.mockResolvedValue({
      getPayload: () => payload,
    } as unknown as LoginTicket);
  };
  const post = (body: object = { credential: 'google-id-token' }) =>
    request(app.getHttpServer()).post('/api/v1/auth/google').set('X-Forwarded-For', ip).send(body);

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    ipCounter += 1;
    ip = `10.1.0.${ipCounter}`;
    verifyIdToken = vi.spyOn(OAuth2Client.prototype, 'verifyIdToken');
    signInWith(GOOGLE_USER);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('tạo tài khoản học sinh lần đầu và mở phiên đăng nhập', async () => {
    const response = await post({ credential: 'google-id-token', role: 'ADMIN' }).expect(200);

    expect(verifyIdToken).toHaveBeenCalledWith({
      idToken: 'google-id-token',
      audience: 'test-google-client-id',
    });
    expect(response.body.data.user).toMatchObject({
      email: GOOGLE_USER.email,
      displayName: GOOGLE_USER.name,
      role: 'STUDENT',
    });
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.headers['set-cookie']?.[0]).toContain('refresh_token=');

    const user = await prisma.user.findUniqueOrThrow({ where: { email: GOOGLE_USER.email } });
    expect(user).toMatchObject({ googleId: GOOGLE_USER.sub, passwordHash: null });
  });

  it('các lần sau nhận ra người dùng theo Google ID, kể cả khi đổi email', async () => {
    const first = await post().expect(200);
    signInWith({ ...GOOGLE_USER, email: 'moi@example.com', name: 'Tên mới' });

    const second = await post().expect(200);

    expect(second.body.data.user).toEqual(first.body.data.user);
    expect(await prisma.user.count()).toBe(1);
  });

  it('không gộp vào tài khoản mật khẩu có cùng email', async () => {
    const before = await prisma.user.create({
      data: { email: GOOGLE_USER.email, displayName: 'Chủ cũ', passwordHash: 'hash-cu' },
    });

    const response = await post().expect(409);

    expect(response.body.error.code).toBe(ERROR_CODES.GOOGLE_EMAIL_IN_USE);
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(await prisma.user.findUniqueOrThrow({ where: { id: before.id } })).toEqual(before);
    expect(await prisma.refreshSession.count()).toBe(0);
  });

  it('dùng phần trước @ của email khi tên Google không hợp lệ', async () => {
    signInWith({ ...GOOGLE_USER, name: 'x'.repeat(101) });

    const response = await post().expect(200);

    expect(response.body.data.user.displayName).toBe('an');
  });

  it.each([
    ['email chưa xác minh', { ...GOOGLE_USER, email_verified: false }],
    ['thiếu email', { ...GOOGLE_USER, email: undefined }],
    ['thiếu Google ID', { ...GOOGLE_USER, sub: '' }],
  ])('trả 401 khi %s', async (_name, payload) => {
    signInWith(payload);

    const response = await post().expect(401);

    expect(response.body.error.code).toBe(ERROR_CODES.GOOGLE_TOKEN_INVALID);
    expect(await prisma.user.count()).toBe(0);
  });

  it('trả 401 khi Google từ chối token', async () => {
    verifyIdToken.mockRejectedValue(
      new Error('Wrong recipient, payload audience != requiredAudience'),
    );

    const response = await post().expect(401);

    expect(response.body.error.code).toBe(ERROR_CODES.GOOGLE_TOKEN_INVALID);
  });

  it('trả 503 khi không tải được khoá của Google', async () => {
    verifyIdToken.mockRejectedValue(
      new Error('Failed to retrieve verification certificates: network'),
    );

    const response = await post().expect(503);

    expect(response.body.error.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
  });

  it('từ chối body sai và không gọi Google', async () => {
    await post({}).expect(400);
    await post({ credential: 'x'.repeat(4097) }).expect(400);

    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('từ chối nguồn gửi không được phép', async () => {
    await post().set('Origin', 'https://web-la.example').expect(403);

    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('giới hạn số lần gọi theo IP', async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await post().expect(200);
    }

    await post().expect(429);
  });

  it('trả 503 khi chưa cấu hình Client ID', async () => {
    const config = { get: () => '' } as unknown as ConfigService<Env, true>;

    await expect(new GoogleIdentityService(config).verify('token')).rejects.toMatchObject({
      response: { code: ERROR_CODES.SERVICE_UNAVAILABLE },
    });
    expect(verifyIdToken).not.toHaveBeenCalled();
  });
});
