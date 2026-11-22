import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

describe('GET /admin/classes/overview', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let admin: { id: string; token: string };
  let teacher: { id: string; token: string };
  let student1: { id: string; token: string };
  let _student2: { id: string; token: string };

  const server = () => request(app.getHttpServer());
  const createUser = async (
    email: string,
    role: 'STUDENT' | 'TEACHER' | 'ADMIN' = 'STUDENT',
    displayName = email,
  ) => {
    const user = await prisma.user.create({ data: { email, displayName, role } });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    admin = await createUser('admin@example.com', 'ADMIN', 'Quản trị viên');
    teacher = await createUser('teacher@example.com', 'TEACHER', 'Thầy Hưng');
    student1 = await createUser('student1@example.com', 'STUDENT', 'Nguyễn Văn A');
    _student2 = await createUser('student2@example.com', 'STUDENT', 'Trần Thị B');

    // Tạo lớp học cho giáo viên và thêm student1 vào lớp
    await prisma.class.create({
      data: {
        teacherId: teacher.id,
        name: 'Tiếng Anh 8A1',
        joinCode: 'ABCXYZ',
        members: {
          create: {
            userId: student1.id,
          },
        },
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('chỉ ADMIN mới có quyền truy cập', async () => {
    await server().get('/api/v1/admin/classes/overview').expect(401);
    await server()
      .get('/api/v1/admin/classes/overview')
      .set('Authorization', `Bearer ${teacher.token}`)
      .expect(403);
    await server()
      .get('/api/v1/admin/classes/overview')
      .set('Authorization', `Bearer ${student1.token}`)
      .expect(403);
  });

  it('trả về danh sách lớp học theo giáo viên và danh sách học sinh chưa có lớp', async () => {
    const res = await server()
      .get('/api/v1/admin/classes/overview')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);

    expect(res.body.data).toMatchObject({
      totalClasses: 1,
      totalStudentsInClasses: 1,
      totalUnassignedStudents: 1, // student2 chưa vào lớp nào
    });

    // Kiểm tra thông tin lớp
    expect(res.body.data.classes).toHaveLength(1);
    const cls = res.body.data.classes[0];
    expect(cls.name).toBe('Tiếng Anh 8A1');
    expect(cls.teacher.displayName).toBe('Thầy Hưng');
    expect(cls.memberCount).toBe(1);
    expect(cls.members).toHaveLength(1);
    expect(cls.members[0].displayName).toBe('Nguyễn Văn A');

    // Kiểm tra học sinh chưa có lớp
    expect(res.body.data.unassignedStudents).toHaveLength(1);
    expect(res.body.data.unassignedStudents[0].displayName).toBe('Trần Thị B');
  });
});
