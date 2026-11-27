import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const DAY_MS = 86_400_000;

describe('Thông báo', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let teacher: { id: string; token: string };
  let student: { id: string; token: string };
  let other: { id: string; token: string };
  let classId: string;
  let setId: string;

  const server = () => request(app.getHttpServer());
  const as = (token: string) => ({
    get: (path: string) => server().get(`/api/v1${path}`).set('Authorization', `Bearer ${token}`),
    patch: (path: string) =>
      server().patch(`/api/v1${path}`).set('Authorization', `Bearer ${token}`),
    post: (path: string) => server().post(`/api/v1${path}`).set('Authorization', `Bearer ${token}`),
  });
  const createUser = async (name: string, role: 'STUDENT' | 'TEACHER' = 'STUDENT') => {
    const user = await prisma.user.create({
      data: { email: `${name}@example.com`, displayName: name, role },
    });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    teacher = await createUser('teacher', 'TEACHER');
    student = await createUser('student');
    other = await createUser('other');
    const klass = await prisma.class.create({
      data: {
        teacherId: teacher.id,
        name: '10A1',
        joinCode: 'ABC123',
        members: { create: [{ userId: student.id }] },
      },
    });
    classId = klass.id;
    const set = await prisma.studySet.create({
      data: {
        ownerId: teacher.id,
        title: 'Unit 5',
        visibility: 'PUBLIC',
        cardCount: 1,
        cards: { create: [{ term: 'one', definition: 'một', position: 0 }] },
      },
    });
    setId = set.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('trả 401 khi chưa đăng nhập', async () => {
    await server().get('/api/v1/notifications/unread-count').expect(401);
  });

  it('giao bài thì học sinh trong lớp nhận thông báo, bấm đọc thì hết chưa đọc', async () => {
    const created = await as(teacher.token)
      .post(`/classes/${classId}/assignments`)
      .send({ setId, modes: ['FLASHCARD'] })
      .expect(201);
    const assignmentId = created.body.data.id as string;

    expect(
      (await as(student.token).get('/notifications/unread-count').expect(200)).body.data,
    ).toEqual({
      count: 1,
    });
    expect((await as(other.token).get('/notifications/unread-count')).body.data.count).toBe(0);

    const { body } = await as(student.token).get('/notifications').expect(200);
    expect(body.meta).toEqual({ page: 1, limit: 20, total: 1 });
    expect(body.data[0]).toMatchObject({
      type: 'ASSIGNMENT_NEW',
      data: { setTitle: 'Unit 5', className: '10A1', dueAt: null },
      href: `/classes/assignments/${assignmentId}`,
      readAt: null,
    });

    await as(student.token)
      .patch(`/notifications/${body.data[0].id as string}/read`)
      .expect(204);
    expect((await as(student.token).get('/notifications/unread-count')).body.data.count).toBe(0);
  });

  it('không đánh dấu được thông báo của người khác', async () => {
    const notification = await prisma.notification.create({
      data: { userId: student.id, type: 'REVIEW_DUE', data: { count: 3 } },
    });
    await as(other.token).patch(`/notifications/${notification.id}/read`).expect(404);
    await as(student.token).patch('/notifications/khong-co/read').expect(404);
  });

  it('đánh dấu đã đọc hết và dọn thông báo quá 90 ngày', async () => {
    await prisma.notification.createMany({
      data: [
        { userId: student.id, type: 'REVIEW_DUE', data: { count: 3 } },
        { userId: student.id, type: 'BADGE_EARNED', data: { code: 'streak-7' } },
        {
          userId: student.id,
          type: 'REVIEW_DUE',
          data: { count: 1 },
          createdAt: new Date(Date.now() - 91 * DAY_MS),
        },
      ],
    });
    await as(student.token).post('/notifications/read-all').expect(204);
    expect((await as(student.token).get('/notifications/unread-count')).body.data.count).toBe(0);

    const { body } = await as(student.token).get('/notifications').expect(200);
    expect(body.meta.total).toBe(2);
    expect(body.data.every((n: { readAt: string | null }) => n.readAt !== null)).toBe(true);
  });
});
