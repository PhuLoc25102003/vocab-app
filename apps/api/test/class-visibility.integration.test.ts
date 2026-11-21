import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { Role } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

describe('quyền xem bộ từ CLASS', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let teacher: { id: string; token: string };
  let student: { id: string; token: string };
  let outsider: { id: string; token: string };
  let setId: string;
  let classId: string;

  const createUser = async (email: string, role: Role = 'STUDENT') => {
    const user = await prisma.user.create({ data: { email, displayName: email, role } });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };
  const getSet = (token: string) =>
    request(app.getHttpServer())
      .get(`/api/v1/sets/${setId}`)
      .set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    teacher = await createUser('gv@example.com', 'TEACHER');
    student = await createUser('hs@example.com');
    outsider = await createUser('ngoai@example.com');
    setId = (
      await prisma.studySet.create({
        data: {
          ownerId: teacher.id,
          title: 'Unit 1 lớp 10A1',
          visibility: 'CLASS',
          cardCount: 1,
          cards: { create: { position: 0, term: 'apple', definition: 'quả táo' } },
        },
      })
    ).id;
    classId = (
      await prisma.class.create({
        data: {
          teacherId: teacher.id,
          name: '10A1',
          joinCode: 'ABC234',
          members: { create: { userId: student.id } },
          assignments: { create: { setId, mode: 'FLASHCARD' } },
        },
      })
    ).id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('thành viên lớp được giao bộ thì xem và bắt đầu học được', async () => {
    await getSet(student.token).expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/study/sessions')
      .set('Authorization', `Bearer ${student.token}`)
      .send({ setId, mode: 'FLASHCARD' })
      .expect(201);
  });

  it('người ngoài lớp không thấy bộ, như bộ không tồn tại', async () => {
    await getSet(outsider.token).expect(404);
  });

  it('học sinh rời lớp hoặc lớp bị lưu trữ thì mất quyền xem', async () => {
    await prisma.classMember.delete({
      where: { classId_userId: { classId, userId: student.id } },
    });
    await getSet(student.token).expect(404);

    await prisma.classMember.create({ data: { classId, userId: student.id } });
    await prisma.class.update({ where: { id: classId }, data: { archivedAt: new Date() } });
    await getSet(student.token).expect(404);
  });

  it('lớp chưa được giao bộ thì thành viên không xem được', async () => {
    await prisma.assignment.deleteMany({ where: { classId } });

    await getSet(student.token).expect(404);
  });

  it('bộ CLASS không xuất hiện trong Khám phá', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/sets/public')
      .set('Authorization', `Bearer ${student.token}`)
      .expect(200);

    expect(response.body.data).toEqual([]);
  });
});
