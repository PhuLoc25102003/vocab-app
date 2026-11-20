import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES, JOIN_CODE_ALPHABET, JOIN_CODE_LENGTH, type Role } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { generateJoinCode } from '../src/modules/classes/classes.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

interface ClassBody {
  id: string;
  name: string;
  description: string | null;
  joinCode: string;
  archivedAt: string | null;
  memberCount: number;
}

describe('classes', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let teacher: { id: string; token: string };
  let otherTeacher: { id: string; token: string };
  let student: { id: string; token: string };
  let admin: { id: string; token: string };

  const createUser = async (email: string, role: Role) => {
    const user = await prisma.user.create({ data: { email, displayName: email, role } });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };
  const call = (method: 'get' | 'post' | 'patch', url: string, token: string) =>
    request(app.getHttpServer())[method](`/api/v1${url}`).set('Authorization', `Bearer ${token}`);
  const createClass = async (body: object = { name: '10A1' }, token = teacher.token) =>
    (await call('post', '/classes', token).send(body).expect(201)).body.data as ClassBody;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    teacher = await createUser('gv@example.com', 'TEACHER');
    otherTeacher = await createUser('gv2@example.com', 'TEACHER');
    student = await createUser('hs@example.com', 'STUDENT');
    admin = await createUser('admin@example.com', 'ADMIN');
  });

  afterAll(async () => {
    await app.close();
  });

  it('mã tham gia gồm 6 ký tự không dễ nhầm', () => {
    const code = generateJoinCode();
    expect(code).toHaveLength(JOIN_CODE_LENGTH);
    expect([...code].every((char) => JOIN_CODE_ALPHABET.includes(char))).toBe(true);
  });

  it('cần đăng nhập', async () => {
    await request(app.getHttpServer()).get('/api/v1/classes').expect(401);
    await request(app.getHttpServer()).post('/api/v1/classes').send({ name: 'A' }).expect(401);
  });

  it('học sinh không tạo và không liệt kê được lớp', async () => {
    const created = await call('post', '/classes', student.token)
      .send({ name: '10A1' })
      .expect(403);
    expect(created.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    await call('get', '/classes', student.token).expect(403);
  });

  it('giáo viên tạo lớp, server sinh mã và bỏ khoảng trắng', async () => {
    const created = await createClass({ name: '  10A1 ', description: ' Lớp chiều ' });

    expect(created).toMatchObject({
      name: '10A1',
      description: 'Lớp chiều',
      archivedAt: null,
      memberCount: 0,
    });
    expect(created.joinCode).toMatch(/^[A-Z2-9]{6}$/);
    const saved = await prisma.class.findUniqueOrThrow({ where: { id: created.id } });
    expect(saved.teacherId).toBe(teacher.id);
  });

  it('không nhận teacherId hay joinCode từ client và kiểm tra dữ liệu', async () => {
    const created = await createClass({
      name: '10A1',
      teacherId: otherTeacher.id,
      joinCode: 'AAAAAA',
    });
    expect(created.joinCode).not.toBe('AAAAAA');
    expect((await prisma.class.findUniqueOrThrow({ where: { id: created.id } })).teacherId).toBe(
      teacher.id,
    );

    const invalid = await call('post', '/classes', teacher.token)
      .send({ name: '   ', description: 'x'.repeat(501) })
      .expect(400);
    expect(invalid.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  });

  it('liệt kê lớp mình dạy, mới tạo trước, kèm số thành viên, tách lớp lưu trữ', async () => {
    const first = await createClass({ name: 'Lớp 1' });
    const second = await createClass({ name: 'Lớp 2' });
    const archived = await createClass({ name: 'Lớp cũ' });
    await createClass({ name: 'Của người khác' }, otherTeacher.token);
    await prisma.class.update({ where: { id: archived.id }, data: { archivedAt: new Date() } });
    await prisma.class.update({ where: { id: first.id }, data: { createdAt: new Date(0) } });
    await prisma.classMember.create({ data: { classId: second.id, userId: student.id } });

    const active = await call('get', '/classes?limit=1', teacher.token).expect(200);
    expect(active.body.meta).toEqual({ page: 1, limit: 1, total: 2 });
    expect(active.body.data).toMatchObject([{ id: second.id, memberCount: 1 }]);

    const old = await call('get', '/classes?archived=true', teacher.token).expect(200);
    expect(old.body.data.map(({ id }: ClassBody) => id)).toEqual([archived.id]);
  });

  it('chỉ giáo viên của lớp và ADMIN xem được lớp', async () => {
    const created = await createClass();

    await call('get', `/classes/${created.id}`, teacher.token).expect(200);
    await call('get', `/classes/${created.id}`, admin.token).expect(200);
    await call('get', `/classes/${created.id}`, otherTeacher.token).expect(403);
    await call('get', `/classes/${created.id}`, student.token).expect(403);
    const missing = await call('get', '/classes/khong-co', teacher.token).expect(404);
    expect(missing.body.error.code).toBe(ERROR_CODES.CLASS_NOT_FOUND);
  });

  it('sửa tên, xoá mô tả, lưu trữ rồi mở lại lớp', async () => {
    const created = await createClass({ name: '10A1', description: 'Cũ' });

    const renamed = await call('patch', `/classes/${created.id}`, teacher.token)
      .send({ name: '10A2', description: '  ' })
      .expect(200);
    expect(renamed.body.data).toMatchObject({ name: '10A2', description: null });

    const archived = await call('patch', `/classes/${created.id}`, teacher.token)
      .send({ archived: true })
      .expect(200);
    expect(archived.body.data.archivedAt).not.toBeNull();

    const reopened = await call('patch', `/classes/${created.id}`, admin.token)
      .send({ archived: false })
      .expect(200);
    expect(reopened.body.data.archivedAt).toBeNull();

    await call('patch', `/classes/${created.id}`, teacher.token).send({}).expect(400);
    await call('patch', `/classes/${created.id}`, otherTeacher.token)
      .send({ name: 'Chiếm' })
      .expect(403);
  });

  it('đổi mã tham gia, mã cũ không còn thuộc lớp nào', async () => {
    const created = await createClass();

    const changed = await call('post', `/classes/${created.id}/join-code`, teacher.token).expect(
      200,
    );

    expect(changed.body.data.joinCode).not.toBe(created.joinCode);
    expect(await prisma.class.findUnique({ where: { joinCode: created.joinCode } })).toBeNull();
    await call('post', `/classes/${created.id}/join-code`, otherTeacher.token).expect(403);
  });
});
