import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { InMemoryMailer, Mailer } from '../src/infrastructure/mail/mailer';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const account = { email: 'hoc@example.com', password: 'mat-khau-dai', displayName: 'Học sinh' };
const SENT =
  'Nếu email này có tài khoản, thư đặt lại mật khẩu sẽ tới trong vài phút. Hãy kiểm tra cả mục Spam.';

describe('quên mật khẩu', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let mailer: InMemoryMailer;
  let ipCounter = 0;

  const server = () => request(app.getHttpServer());
  const nextIp = () => {
    ipCounter += 1;
    return `10.7.${Math.floor(ipCounter / 250)}.${(ipCounter % 250) + 1}`;
  };
  const post = (path: string, body: object) =>
    server().post(`/api/v1/auth/${path}`).set('X-Forwarded-For', nextIp()).send(body);
  const tokenFromMail = () => {
    const text = mailer.sent.at(-1)?.text ?? '';
    return /reset-password\?token=([A-Za-z0-9_-]+)/.exec(text)?.[1] ?? '';
  };

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    const injected = app.get(Mailer);
    if (!(injected instanceof InMemoryMailer)) throw new Error('Test cần bộ gửi thư trong bộ nhớ');
    mailer = injected;
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    mailer.sent.length = 0;
    await post('register', account).expect(202);
  });

  afterAll(async () => {
    await app.close();
  });

  it('gửi thư có liên kết, chỉ lưu hash của token', async () => {
    const { body } = await post('forgot-password', { email: ' HOC@example.com ' }).expect(202);

    expect(body.data.message).toBe(SENT);
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0]).toMatchObject({ to: account.email, subject: 'Đặt lại mật khẩu Nhớ Từ' });
    const token = tokenFromMail();
    expect(token).toHaveLength(43);
    const stored = await prisma.passwordResetToken.findFirstOrThrow();
    expect(stored.tokenHash).not.toBe(token);
  });

  it('email không có tài khoản nhận cùng thông báo và không gửi thư', async () => {
    const { body } = await post('forgot-password', { email: 'ai@example.com' }).expect(202);

    expect(body.data.message).toBe(SENT);
    expect(mailer.sent).toHaveLength(0);
    await post('forgot-password', { email: 'khong-phai-email' }).expect(400);
  });

  it('đặt mật khẩu mới, kết thúc phiên cũ, token chỉ dùng được một lần', async () => {
    const login = await post('login', account).expect(200);
    const cookie = login.headers['set-cookie']?.[0]?.split(';')[0] ?? '';
    await post('forgot-password', { email: account.email }).expect(202);
    const token = tokenFromMail();

    await post('reset-password', { token, password: 'mat-khau-moi-123' }).expect(200);

    await post('login', account).expect(401);
    await post('login', { ...account, password: 'mat-khau-moi-123' }).expect(200);
    await server()
      .post('/api/v1/auth/refresh')
      .set('X-Forwarded-For', nextIp())
      .set('Cookie', cookie)
      .expect(401);
    const reused = await post('reset-password', { token, password: 'mat-khau-khac-123' }).expect(
      400,
    );
    expect(reused.body.error.code).toBe(ERROR_CODES.RESET_TOKEN_INVALID);
  });

  it('token hết hạn, token cũ sau khi xin liên kết mới và token sai đều bị từ chối', async () => {
    await post('forgot-password', { email: account.email }).expect(202);
    const first = tokenFromMail();
    await post('forgot-password', { email: account.email }).expect(202);
    const second = tokenFromMail();

    await post('reset-password', { token: first, password: 'mat-khau-moi-123' }).expect(400);
    await prisma.passwordResetToken.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await post('reset-password', { token: second, password: 'mat-khau-moi-123' }).expect(400);
    await post('reset-password', { token: 'a'.repeat(43), password: 'mat-khau-moi-123' }).expect(
      400,
    );
    await post('reset-password', { token: 'ngắn', password: 'mat-khau-moi-123' }).expect(400);
  });

  it('tài khoản bị khoá không nhận thư', async () => {
    await prisma.user.update({
      where: { email: account.email },
      data: { lockedAt: new Date(), lockReason: 'Thử' },
    });

    await post('forgot-password', { email: account.email }).expect(202);

    expect(mailer.sent).toHaveLength(0);
  });
});
