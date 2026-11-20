import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const student = { email: 'hoc@example.com', password: 'mat-khau-dai', displayName: 'Học sinh' };

describe('admin users', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let admin: { id: string; token: string };
  let studentId: string;
  let studentToken: string;
  let ipCounter = 0;

  const server = () => request(app.getHttpServer());
  const nextIp = () => {
    ipCounter += 1;
    return `10.9.${Math.floor(ipCounter / 250)}.${(ipCounter % 250) + 1}`;
  };
  const auth = (path: string, body: object) =>
    server().post(`/api/v1/auth/${path}`).set('X-Forwarded-For', nextIp()).send(body);
  const list = (token: string | null, query = '') => {
    const call = server().get(`/api/v1/admin/users${query}`);
    return token ? call.set('Authorization', `Bearer ${token}`) : call;
  };
  const patch = (token: string, path: string, body: object = {}) =>
    server()
      .patch(`/api/v1/admin/users/${path}`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  const sign = async (id: string) =>
    app.get(AccessTokenService).sign(await prisma.user.findUniqueOrThrow({ where: { id } }));

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    const adminUser = await prisma.user.create({
      data: { email: 'admin@example.com', displayName: 'Quản trị', role: 'ADMIN' },
    });
    admin = { id: adminUser.id, token: await sign(adminUser.id) };
    await auth('register', student).expect(202);
    const login = await auth('login', student).expect(200);
    studentId = login.body.data.user.id;
    studentToken = login.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('chỉ ADMIN gọi được', async () => {
    await list(null).expect(401);
    const { body } = await list(studentToken).expect(403);
    expect(body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    await patch(studentToken, `${admin.id}/lock`, { reason: 'x' }).expect(403);
  });

  it('liệt kê và tìm theo email hoặc tên, kiểm tra tham số', async () => {
    const { body } = await list(admin.token, '?q=HỌC&sort=email').expect(200);
    expect(body.meta).toEqual({ page: 1, limit: 20, total: 1 });
    expect(body.data).toEqual([
      expect.objectContaining({ id: studentId, email: student.email, lockedAt: null }),
    ]);
    expect(body.data[0]).not.toHaveProperty('passwordHash');

    await list(admin.token, '?sort=passwordHash').expect(400);
    await list(admin.token, '?limit=101').expect(400);
  });

  it('khoá tài khoản: lưu lý do, huỷ mọi phiên, chặn đăng nhập rồi mở khoá', async () => {
    await patch(admin.token, `${studentId}/lock`, { reason: '  ' }).expect(400);

    const { body } = await patch(admin.token, `${studentId}/lock`, {
      reason: 'Đăng nội dung vi phạm',
    }).expect(200);
    expect(body.data).toMatchObject({
      id: studentId,
      lockReason: 'Đăng nội dung vi phạm',
      lockedById: admin.id,
      lockedAt: expect.any(String),
    });
    expect(await prisma.refreshSession.count({ where: { userId: studentId } })).toBe(0);

    await server()
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(401);
    const locked = await auth('login', student).expect(403);
    expect(locked.body.error.code).toBe(ERROR_CODES.ACCOUNT_LOCKED);
    const wrongPassword = await auth('login', { ...student, password: 'sai-mat-khau' }).expect(401);
    expect(wrongPassword.body.error.code).toBe(ERROR_CODES.INVALID_CREDENTIALS);

    const unlocked = await patch(admin.token, `${studentId}/unlock`).expect(200);
    expect(unlocked.body.data).toMatchObject({
      lockedAt: null,
      lockReason: null,
      lockedById: null,
    });
    await auth('login', student).expect(200);
  });

  it('không tự khoá mình, báo 404 với người dùng không tồn tại', async () => {
    const self = await patch(admin.token, `${admin.id}/lock`, { reason: 'Thử' }).expect(422);
    expect(self.body.error.code).toBe(ERROR_CODES.CANNOT_LOCK_SELF);

    const missing = await patch(admin.token, 'khong-co/lock', { reason: 'Thử' }).expect(404);
    expect(missing.body.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
    await patch(admin.token, 'khong-co/unlock').expect(404);
  });

  it('ADMIN cấp quyền giáo viên, học sinh dùng được quyền mới ngay', async () => {
    await patch(studentToken, `${studentId}/role`, { role: 'TEACHER' }).expect(403);
    await server()
      .get('/api/v1/classes')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);

    const { body } = await patch(admin.token, `${studentId}/role`, { role: 'TEACHER' }).expect(200);

    expect(body.data).toMatchObject({ id: studentId, role: 'TEACHER' });
    // Vai trò đọc từ database ở mỗi request, token cũ vẫn dùng được với quyền mới.
    await server()
      .get('/api/v1/classes')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
  });

  it('không tự đổi vai trò, vai trò sai trả 400, người không tồn tại trả 404', async () => {
    const self = await patch(admin.token, `${admin.id}/role`, { role: 'STUDENT' }).expect(422);
    expect(self.body.error.code).toBe(ERROR_CODES.CANNOT_CHANGE_OWN_ROLE);
    await patch(admin.token, `${studentId}/role`, { role: 'OWNER' }).expect(400);
    const missing = await patch(admin.token, 'khong-co/role', { role: 'TEACHER' }).expect(404);
    expect(missing.body.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
  });
});
