import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

describe('POST /admin/classes/:id/members', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let admin: { id: string; token: string };
  let teacher: { id: string; token: string };
  let student: { id: string; token: string };
  let classId: string;

  const server = () => request(app.getHttpServer());
  const createUser = async (email: string, role: 'STUDENT' | 'TEACHER' | 'ADMIN') => {
    const user = await prisma.user.create({ data: { email, displayName: email, role } });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };
  const assign = (id: string, userId: string, token = admin.token) =>
    server()
      .post(`/api/v1/admin/classes/${id}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId });

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    admin = await createUser('admin@example.com', 'ADMIN');
    teacher = await createUser('teacher@example.com', 'TEACHER');
    student = await createUser('student@example.com', 'STUDENT');
    const klass = await prisma.class.create({
      data: { teacherId: teacher.id, name: 'Tiếng Anh 8A1', joinCode: 'ABCXYZ' },
    });
    classId = klass.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('chỉ ADMIN được xếp lớp', async () => {
    await server()
      .post(`/api/v1/admin/classes/${classId}/members`)
      .send({ userId: student.id })
      .expect(401);
    await assign(classId, student.id, teacher.token).expect(403);
    await assign(classId, student.id, student.token).expect(403);
  });

  it('xếp học sinh vào lớp, xếp lại thì giữ ngày tham gia cũ', async () => {
    const first = await assign(classId, student.id).expect(200);
    expect(first.body.data).toMatchObject({
      classId,
      className: 'Tiếng Anh 8A1',
      userId: student.id,
      alreadyMember: false,
    });
    const again = await assign(classId, student.id).expect(200);
    expect(again.body.data).toMatchObject({
      alreadyMember: true,
      joinedAt: first.body.data.joinedAt,
    });
    expect(await prisma.classMember.count({ where: { classId } })).toBe(1);

    // Học sinh thấy lớp trong danh sách lớp đã tham gia.
    const joined = await server()
      .get('/api/v1/classes/joined')
      .set('Authorization', `Bearer ${student.token}`)
      .expect(200);
    expect(joined.body.data.map((item: { id: string }) => item.id)).toEqual([classId]);
  });

  it('báo lỗi khi lớp hoặc người dùng không hợp lệ', async () => {
    const missingClass = await assign('khong-co', student.id).expect(404);
    expect(missingClass.body.error.code).toBe('CLASS_NOT_FOUND');

    const missingUser = await assign(classId, 'khong-co').expect(404);
    expect(missingUser.body.error.code).toBe('USER_NOT_FOUND');

    const notStudent = await assign(classId, teacher.id).expect(422);
    expect(notStudent.body.error.code).toBe('USER_NOT_STUDENT');

    await prisma.class.update({ where: { id: classId }, data: { archivedAt: new Date() } });
    const archived = await assign(classId, student.id).expect(409);
    expect(archived.body.error.code).toBe('CLASS_ARCHIVED');

    await assign(classId, '').expect(400);
  });
});
