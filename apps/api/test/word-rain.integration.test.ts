import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { WORD_RAIN_SPOKEN_PREFIX } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

describe('Mưa từ', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let owner: { id: string; token: string };
  let other: { id: string; token: string };
  let setId: string;
  let cardIds: string[];

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
  const start = async (mode = 'WORD_RAIN') =>
    (await as(owner.token).post('/study/sessions').send({ setId, mode }).expect(201)).body.data
      .session.id as string;
  const score = (id: string, body: object, token = owner.token) =>
    as(token).post(`/study/sessions/${id}/word-rain/score`).send(body);

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    owner = await createUser('owner', 'TEACHER');
    other = await createUser('other');
    const set = await prisma.studySet.create({
      data: {
        ownerId: owner.id,
        title: 'Đồ ăn',
        visibility: 'PUBLIC',
        cardCount: 4,
        cards: {
          create: [
            { term: 'apple', definition: 'quả táo', position: 0 },
            { term: 'ice cream', definition: 'kem', position: 1 },
            { term: 'rice', definition: 'cơm', position: 2 },
            { term: 'bread', definition: 'bánh mì', position: 3 },
          ],
        },
      },
      include: { cards: { orderBy: { position: 'asc' } } },
    });
    setId = set.id;
    cardIds = set.cards.map(({ id }) => id);
  });

  afterAll(async () => {
    await app.close();
  });

  it('chấm đáp án gõ, đáp án nói và mục tiêu bị lọt', async () => {
    const id = await start();
    const { body } = await as(owner.token)
      .post(`/study/sessions/${id}/answers`)
      .send({
        answers: [
          { questionId: cardIds[0], value: 'Apple', timeMs: 900 },
          { questionId: cardIds[1], value: `${WORD_RAIN_SPOKEN_PREFIX}ice cream`, timeMs: 1500 },
          { questionId: cardIds[2], value: '', timeMs: 4000 },
        ],
      })
      .expect(200);
    expect(body.data.results.map((r: { isCorrect: boolean }) => r.isCorrect)).toEqual([
      true,
      true,
      false,
    ]);
  });

  it('lưu điểm cao theo kiểu chơi, chỉ ghi khi cao hơn', async () => {
    const id = await start();
    const first = await score(id, { style: 'TYPE', score: 1200, wave: 3 }).expect(200);
    expect(first.body.data).toEqual({ best: { score: 1200, wave: 3 }, isRecord: true });

    const lower = await score(id, { style: 'TYPE', score: 800, wave: 5 }).expect(200);
    expect(lower.body.data).toEqual({ best: { score: 1200, wave: 3 }, isRecord: false });

    await score(id, { style: 'SPEAK', score: 300, wave: 1 }).expect(200);
    const typed = await as(owner.token).get(`/sets/${setId}/word-rain/high-score?style=TYPE`);
    expect(typed.body.data).toEqual({ score: 1200, wave: 3 });
    const spoken = await as(owner.token).get(`/sets/${setId}/word-rain/high-score?style=SPEAK`);
    expect(spoken.body.data).toEqual({ score: 300, wave: 1 });
    const none = await as(other.token).get(`/sets/${setId}/word-rain/high-score`).expect(200);
    expect(none.body.data).toBeNull();
  });

  it('từ chối lưu điểm của phiên người khác, phiên không phải Mưa từ và điểm sai', async () => {
    const id = await start();
    await score(id, { style: 'TYPE', score: 10, wave: 1 }, other.token).expect(403);
    const write = await start('WRITE');
    await score(write, { style: 'TYPE', score: 10, wave: 1 }).expect(422);
    await score(id, { style: 'TYPE', score: -1, wave: 0 }).expect(400);
  });

  it('giao Mưa từ cần bộ có ít nhất 4 thẻ', async () => {
    const klass = await prisma.class.create({
      data: { teacherId: owner.id, name: '10A1', joinCode: 'ABC123' },
    });
    const small = await prisma.studySet.create({
      data: {
        ownerId: owner.id,
        title: 'Ít thẻ',
        visibility: 'PUBLIC',
        cardCount: 3,
        cards: {
          create: [0, 1, 2].map((position) => ({
            term: `t${position}`,
            definition: `d${position}`,
            position,
          })),
        },
      },
    });
    await as(owner.token)
      .post(`/classes/${klass.id}/assignments`)
      .send({ setId: small.id, modes: ['WORD_RAIN'] })
      .expect(422);
    await as(owner.token)
      .post(`/classes/${klass.id}/assignments`)
      .send({ setId, modes: ['WORD_RAIN'] })
      .expect(201);
  });
});
