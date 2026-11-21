import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES, type Role } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

describe('thành viên lớp', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let teacher: { id: string; token: string };
  let otherTeacher: { id: string; token: string };
  let student: { id: string; token: string };
  let classmate: { id: string; token: string };
  let classId: string;

  const createUser = async (email: string, role: Role = 'STUDENT') => {
    const user = await prisma.user.create({ data: { email, displayName: `Tên ${email}`, role } });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };
  const call = (method: 'get' | 'post' | 'delete', url: string, token: string) =>
    request(app.getHttpServer())[method](`/api/v1${url}`).set('Authorization', `Bearer ${token}`);
  const join = (token: string, joinCode = 'ABC234') =>
    call('post', '/classes/join', token).send({ joinCode });

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    teacher = await createUser('gv@example.com', 'TEACHER');
    otherTeacher = await createUser('gv2@example.com', 'TEACHER');
    student = await createUser('hs@example.com');
    classmate = await createUser('hs2@example.com');
    classId = (
      await prisma.class.create({
        data: { teacherId: teacher.id, name: '10A1', description: 'Chiều', joinCode: 'ABC234' },
      })
    ).id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('cần đăng nhập', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/classes/join')
      .send({ joinCode: 'ABC234' })
      .expect(401);
  });

  it('học sinh tham gia bằng mã, không phân biệt hoa thường, tham gia lại không bị trùng', async () => {
    const joined = await join(student.token, ' abc234 ').expect(200);

    expect(joined.body.data).toMatchObject({
      id: classId,
      name: '10A1',
      description: 'Chiều',
      teacherName: 'Tên gv@example.com',
    });
    await join(student.token).expect(200);
    expect(await prisma.classMember.count()).toBe(1);
  });

  it('mã sai định dạng trả 400, mã không có hoặc lớp đã lưu trữ trả 404', async () => {
    const invalid = await join(student.token, 'AB1').expect(400);
    expect(invalid.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);

    const missing = await join(student.token, 'ZZZZZZ').expect(404);
    expect(missing.body.error.code).toBe(ERROR_CODES.CLASS_NOT_FOUND);

    await prisma.class.update({ where: { id: classId }, data: { archivedAt: new Date() } });
    await join(student.token).expect(404);
  });

  it('giáo viên không tự tham gia lớp mình dạy', async () => {
    const response = await join(teacher.token).expect(422);
    expect(response.body.error.code).toBe(ERROR_CODES.CLASS_TEACHER_CANNOT_JOIN);
  });

  it('liệt kê lớp đã tham gia, bỏ lớp đã lưu trữ', async () => {
    const archived = await prisma.class.create({
      data: {
        teacherId: otherTeacher.id,
        name: 'Lớp cũ',
        joinCode: 'OLD234',
        archivedAt: new Date(),
      },
    });
    await join(student.token).expect(200);
    await prisma.classMember.create({ data: { classId: archived.id, userId: student.id } });

    const response = await call('get', '/classes/joined', student.token).expect(200);

    expect(response.body.meta.total).toBe(1);
    expect(response.body.data).toMatchObject([{ id: classId }]);

    // Tìm theo tên lớp (việc 5.30).
    const found = await call('get', '/classes/joined?q=khong-co', student.token).expect(200);
    expect(found.body.meta.total).toBe(0);
  });

  it('học sinh rời lớp, rời lần nữa trả 404', async () => {
    await join(student.token).expect(200);

    await call('delete', `/classes/${classId}/members/me`, student.token).expect(204);

    const again = await call('delete', `/classes/${classId}/members/me`, student.token).expect(404);
    expect(again.body.error.code).toBe(ERROR_CODES.CLASS_MEMBER_NOT_FOUND);
  });

  it('giáo viên xem thành viên theo thứ tự tham gia, chỉ có tên hiển thị', async () => {
    await join(student.token).expect(200);
    await join(classmate.token).expect(200);
    await prisma.classMember.update({
      where: { classId_userId: { classId, userId: student.id } },
      data: { joinedAt: new Date(0) },
    });

    const response = await call('get', `/classes/${classId}/members`, teacher.token).expect(200);

    expect(response.body.meta.total).toBe(2);
    expect(response.body.data.map(({ userId }: { userId: string }) => userId)).toEqual([
      student.id,
      classmate.id,
    ]);
    expect(Object.keys(response.body.data[0]).sort()).toEqual([
      'displayName',
      'joinedAt',
      'stats',
      'userId',
    ]);
    expect(response.body.data[0].stats).toEqual({
      onTime: 0,
      late: 0,
      missed: 0,
      pending: 0,
      averageScore: null,
      lastActiveAt: null,
    });

    // Tìm theo tên không phân biệt hoa thường, sắp theo tên.
    const byName = await call(
      'get',
      `/classes/${classId}/members?sort=name&q=HS2%40EXAMPLE`,
      teacher.token,
    ).expect(200);
    expect(byName.body.data.map(({ userId }: { userId: string }) => userId)).toEqual([
      classmate.id,
    ]);
  });

  it('học sinh và giáo viên khác không xem hay xoá được thành viên', async () => {
    await join(student.token).expect(200);

    await call('get', `/classes/${classId}/members`, student.token).expect(403);
    await call('get', `/classes/${classId}/members`, otherTeacher.token).expect(403);
    await call('delete', `/classes/${classId}/members/${student.id}`, otherTeacher.token).expect(
      403,
    );
    await call('delete', `/classes/${classId}/members/${classmate.id}`, student.token).expect(403);
  });

  it('giáo viên xoá học sinh khỏi lớp, người không ở trong lớp trả 404', async () => {
    await join(student.token).expect(200);

    await call('delete', `/classes/${classId}/members/${student.id}`, teacher.token).expect(204);

    expect(await prisma.classMember.count()).toBe(0);
    await call('delete', `/classes/${classId}/members/${student.id}`, teacher.token).expect(404);
  });
});
