import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { InMemoryPushSender } from '../src/infrastructure/push/push-sender';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const subscription = (n: number) => ({
  endpoint: `https://push.example.com/send/${n}`,
  keys: { p256dh: `p256dh-${n}`, auth: `auth-${n}` },
});

describe('Web Push', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let sender: InMemoryPushSender;
  let teacher: { id: string; token: string };
  let student: { id: string; token: string };
  let classId: string;
  let setId: string;

  const as = (token: string) => ({
    get: (path: string) =>
      request(app.getHttpServer()).get(`/api/v1${path}`).set('Authorization', `Bearer ${token}`),
    post: (path: string) =>
      request(app.getHttpServer()).post(`/api/v1${path}`).set('Authorization', `Bearer ${token}`),
  });
  const createUser = async (name: string, role: 'STUDENT' | 'TEACHER' = 'STUDENT') => {
    const user = await prisma.user.create({
      data: { email: `${name}@example.com`, displayName: name, role },
    });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };

  beforeAll(async () => {
    sender = new InMemoryPushSender(true, 'test-public-key');
    app = await createTestApp({}, {}, { push: sender });
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    sender.sent.length = 0;
    sender.goneEndpoints.clear();
    teacher = await createUser('teacher', 'TEACHER');
    student = await createUser('student');
    classId = (
      await prisma.class.create({
        data: {
          teacherId: teacher.id,
          name: '10A1',
          joinCode: 'ABC123',
          members: { create: [{ userId: student.id }] },
        },
      })
    ).id;
    setId = (
      await prisma.studySet.create({
        data: {
          ownerId: teacher.id,
          title: 'Unit 5',
          visibility: 'PUBLIC',
          cardCount: 1,
          cards: { create: [{ term: 'one', definition: 'một', position: 0 }] },
        },
      })
    ).id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('trả cấu hình và khoá công khai', async () => {
    const { body } = await as(student.token).get('/push/config').expect(200);
    expect(body.data).toEqual({ enabled: true, publicKey: 'test-public-key' });
  });

  it('lưu đăng ký, chuyển chủ khi người khác đăng ký cùng máy, huỷ được', async () => {
    await as(student.token).post('/push/subscriptions').send(subscription(1)).expect(204);
    await as(teacher.token).post('/push/subscriptions').send(subscription(1)).expect(204);
    const saved = await prisma.pushSubscription.findMany();
    expect(saved).toHaveLength(1);
    expect(saved[0]!.userId).toBe(teacher.id);

    await as(teacher.token)
      .post('/push/subscriptions/remove')
      .send({ endpoint: subscription(1).endpoint })
      .expect(204);
    expect(await prisma.pushSubscription.count()).toBe(0);
  });

  it('từ chối đăng ký sai định dạng', async () => {
    await as(student.token)
      .post('/push/subscriptions')
      .send({ endpoint: 'khong-phai-url', keys: { p256dh: '', auth: '' } })
      .expect(400);
  });

  it('giao bài thì đẩy tới mọi thiết bị của học sinh và xoá đăng ký đã hết hạn', async () => {
    await as(student.token).post('/push/subscriptions').send(subscription(1)).expect(204);
    await as(student.token).post('/push/subscriptions').send(subscription(2)).expect(204);
    sender.goneEndpoints.add(subscription(2).endpoint);

    const { body } = await as(teacher.token)
      .post(`/classes/${classId}/assignments`)
      .send({ setId, modes: ['FLASHCARD'] })
      .expect(201);

    expect(sender.sent).toHaveLength(1);
    expect(JSON.parse(sender.sent[0]!.payload)).toEqual({
      type: 'ASSIGNMENT_NEW',
      data: { setTitle: 'Unit 5', className: '10A1', dueAt: null },
      href: `/classes/assignments/${body.data.id as string}`,
    });
    expect(await prisma.pushSubscription.count()).toBe(1);
  });
});
