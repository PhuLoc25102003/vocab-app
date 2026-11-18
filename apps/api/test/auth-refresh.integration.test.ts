import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { hashRefreshToken } from '../src/modules/auth/auth-session.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const account = { email: 'an@example.com', password: 'mat-khau-dai', displayName: 'An' };
const credentials = { email: account.email, password: account.password };
const ONE_MINUTE_MS = 60_000;

interface Session {
  accessToken: string;
  refreshToken: string;
}

describe('refresh và đăng xuất', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let ipCounter = 0;
  let ip: string;

  const post = (path: string) =>
    request(app.getHttpServer()).post(`/api/v1/auth/${path}`).set('X-Forwarded-For', ip);
  const withCookie = (path: string, token: string) =>
    post(path).set('Cookie', `refresh_token=${token}`);
  const setCookieOf = (headers: Record<string, unknown>): string =>
    ((headers['set-cookie'] as string[] | undefined) ?? []).find((value) =>
      value.startsWith('refresh_token='),
    ) ?? '';
  const toSession = (response: request.Response): Session => {
    const cookie = setCookieOf(response.headers);
    return {
      accessToken: response.body.data.accessToken as string,
      refreshToken: cookie.slice('refresh_token='.length, cookie.indexOf(';')),
    };
  };
  const login = async (body: object = credentials) =>
    toSession(await post('login').send(body).expect(200));
  const refresh = async (token: string) =>
    toSession(await withCookie('refresh', token).expect(200));
  const expectInvalid = async (token: string) => {
    const response = await withCookie('refresh', token).expect(401);
    expect(response.body.error.code).toBe(ERROR_CODES.REFRESH_TOKEN_INVALID);
    return response;
  };
  /** Đưa phiên cũ ra khỏi khoảng thời gian cho phép các request đồng thời. */
  const ageRevocation = (token: string) =>
    prisma.refreshSession.update({
      where: { tokenHash: hashRefreshToken(token) },
      data: { revokedAt: new Date(Date.now() - ONE_MINUTE_MS) },
    });

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    ipCounter += 1;
    ip = `10.2.0.${ipCounter}`;
    await post('register').send(account).expect(202);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/refresh', () => {
    it('xoay vòng token trong cùng family', async () => {
      const first = await login();

      const response = await withCookie('refresh', first.refreshToken).expect(200);

      const second = toSession(response);
      expect(response.body.data.user.email).toBe(account.email);
      expect(second.refreshToken).not.toBe(first.refreshToken);
      const old = await prisma.refreshSession.findUniqueOrThrow({
        where: { tokenHash: hashRefreshToken(first.refreshToken) },
      });
      const current = await prisma.refreshSession.findUniqueOrThrow({
        where: { tokenHash: hashRefreshToken(second.refreshToken) },
      });
      expect(old.revokedAt).not.toBeNull();
      expect(current.revokedAt).toBeNull();
      expect(current.familyId).toBe(old.familyId);
      await refresh(second.refreshToken);
    });

    it('từ chối khi thiếu cookie hoặc token sai, và xoá cookie', async () => {
      const response = await post('refresh').expect(401);
      expect(response.body.error.code).toBe(ERROR_CODES.REFRESH_TOKEN_INVALID);

      const invalid = await expectInvalid('rac');
      expect(setCookieOf(invalid.headers)).toMatch(/Expires=Thu, 01 Jan 1970/i);
    });

    it('từ chối access token, phiên hết hạn và tài khoản đã xoá', async () => {
      const { accessToken, refreshToken } = await login();
      await expectInvalid(accessToken);

      const tokenHash = hashRefreshToken(refreshToken);
      await prisma.refreshSession.update({
        where: { tokenHash },
        data: { expiresAt: new Date(Date.now() - 1) },
      });
      await expectInvalid(refreshToken);

      const next = await login();
      await prisma.user.update({
        where: { email: account.email },
        data: { deletedAt: new Date() },
      });
      await expectInvalid(next.refreshToken);
    });

    it('hai request đồng thời không làm mất phiên', async () => {
      const { refreshToken } = await login();

      const responses = await Promise.all([
        withCookie('refresh', refreshToken),
        withCookie('refresh', refreshToken),
      ]);

      expect(responses.map(({ status }) => status).sort()).toEqual([200, 409]);
      const winner = responses.find(({ status }) => status === 200);
      const loser = responses.find(({ status }) => status === 409);
      expect(loser?.body.error.code).toBe(ERROR_CODES.REFRESH_IN_PROGRESS);
      expect(setCookieOf(loser?.headers ?? {})).toBe('');
      await refresh(toSession(winner as request.Response).refreshToken);
    });

    it('dùng lại token cũ thì thu hồi cả family, thiết bị khác không bị ảnh hưởng', async () => {
      const stolen = await login();
      const otherDevice = await login();
      const current = await refresh(stolen.refreshToken);
      await ageRevocation(stolen.refreshToken);

      await expectInvalid(stolen.refreshToken);

      await expectInvalid(current.refreshToken);
      await refresh(otherDevice.refreshToken);
    });

    it('chặn Origin lạ và nhận Origin trong CORS_ORIGINS', async () => {
      const { refreshToken } = await login();

      const blocked = await withCookie('refresh', refreshToken)
        .set('Origin', 'https://evil.example')
        .expect(403);
      expect(blocked.body.error.code).toBe(ERROR_CODES.FORBIDDEN);

      await withCookie('refresh', refreshToken).set('Origin', 'http://localhost:3000').expect(200);
    });
  });

  describe('POST /auth/logout', () => {
    it('kết thúc phiên hiện tại, giữ phiên ở thiết bị khác', async () => {
      const current = await login();
      const otherDevice = await login();

      const response = await withCookie('logout', current.refreshToken)
        .set('Authorization', `Bearer ${current.accessToken}`)
        .expect(204);

      expect(setCookieOf(response.headers)).toMatch(/Expires=Thu, 01 Jan 1970/i);
      await expectInvalid(current.refreshToken);
      await refresh(otherDevice.refreshToken);
    });

    it('cần access token', async () => {
      const { refreshToken } = await login();

      await withCookie('logout', refreshToken).expect(401);

      await refresh(refreshToken);
    });

    it('không kết thúc được phiên của người khác', async () => {
      const victim = await login();
      const other = { ...account, email: 'khac@example.com' };
      await post('register').send(other).expect(202);
      const attacker = await login({ email: other.email, password: other.password });

      await withCookie('logout', victim.refreshToken)
        .set('Authorization', `Bearer ${attacker.accessToken}`)
        .expect(204);

      await refresh(victim.refreshToken);
    });
  });

  describe('POST /auth/logout-all', () => {
    it('làm mọi access token và refresh token cũ mất hiệu lực', async () => {
      const first = await login();
      const second = await login();

      await post('logout-all').set('Authorization', `Bearer ${first.accessToken}`).expect(204);

      await post('logout-all').set('Authorization', `Bearer ${second.accessToken}`).expect(401);
      await expectInvalid(first.refreshToken);
      await expectInvalid(second.refreshToken);
      expect(await prisma.refreshSession.count()).toBe(0);
      await login();
    });
  });
});
