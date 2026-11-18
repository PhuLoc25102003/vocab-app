import { Controller, Get } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ok } from '../src/common/base/pagination';
import { CurrentUser, type CurrentUserData } from '../src/common/decorators/current-user.decorator';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const account = { email: 'an@example.com', password: 'mat-khau-dai', displayName: 'An' };
const credentials = { email: account.email, password: account.password };
const accessSecret = 'test-only-access-secret-at-least-32-chars';
const refreshSecret = 'test-only-refresh-secret-at-least-32-chars';

@Controller('probe-auth')
class ProbeAuthController {
  @Get('me')
  me(@CurrentUser() user: CurrentUserData) {
    return ok(user);
  }
}

describe('phiên đăng nhập', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let ipCounter = 0;
  let ip: string;

  const auth = (path: string, body: object) =>
    request(app.getHttpServer()).post(`/api/v1/auth/${path}`).set('X-Forwarded-For', ip).send(body);
  const me = (token?: string) => {
    const call = request(app.getHttpServer()).get('/api/v1/probe-auth/me');
    return token ? call.set('Authorization', `Bearer ${token}`) : call;
  };
  const login = async () => {
    const response = await auth('login', credentials).expect(200);
    return response.body.data.accessToken as string;
  };

  beforeAll(async () => {
    app = await createTestApp({ controllers: [ProbeAuthController] });
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    ipCounter += 1;
    ip = `10.1.0.${ipCounter}`;
    await auth('register', account).expect(202);
  });

  afterAll(async () => {
    await app.close();
  });

  it('access token hợp lệ vào được route cần đăng nhập', async () => {
    const accessToken = await login();
    const user = await prisma.user.findUniqueOrThrow({ where: { email: account.email } });

    const response = await me(accessToken).expect(200);

    expect(response.body).toEqual({ data: { id: user.id, role: 'STUDENT' } });
  });

  it('dùng vai trò mới nhất trong database', async () => {
    const accessToken = await login();
    await prisma.user.update({ where: { email: account.email }, data: { role: 'TEACHER' } });

    const response = await me(accessToken).expect(200);

    expect(response.body.data.role).toBe('TEACHER');
  });

  it('trả TOKEN_EXPIRED khi access token hết hạn', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: account.email } });
    const expired = await jwt.signAsync(
      { sub: user.id, role: user.role, tv: user.tokenVersion },
      { secret: accessSecret, algorithm: 'HS256', expiresIn: -10 },
    );

    const response = await me(expired).expect(401);

    expect(response.body.error.code).toBe(ERROR_CODES.TOKEN_EXPIRED);
  });

  it('từ chối khi thiếu token, token sai hoặc ký bằng secret khác', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: account.email } });
    const unsigned = [
      Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url'),
      Buffer.from(JSON.stringify({ sub: user.id, tv: 0 })).toString('base64url'),
      '',
    ].join('.');
    const wrongSecret = await jwt.signAsync(
      { sub: user.id, tv: 0 },
      { secret: refreshSecret, algorithm: 'HS256', expiresIn: 60 },
    );

    for (const token of [undefined, 'rac', unsigned, wrongSecret]) {
      const response = await me(token).expect(401);
      expect(response.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    }
  });

  it('từ chối token cũ sau khi tokenVersion tăng hoặc tài khoản bị xoá', async () => {
    const accessToken = await login();
    const where = { email: account.email };

    await prisma.user.update({ where, data: { tokenVersion: { increment: 1 } } });
    await me(accessToken).expect(401);

    await prisma.user.update({ where, data: { tokenVersion: 0, deletedAt: new Date() } });
    await me(accessToken).expect(401);
  });
});
