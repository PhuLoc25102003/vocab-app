import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { MASTERED_INTERVAL_DAYS } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const DAY_MS = 86_400_000;

describe('GET /stats/overview', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let owner: { id: string; token: string };
  let other: { id: string; token: string };
  let setId: string;
  let cardIds: string[];

  const createUser = async (email: string) => {
    const user = await prisma.user.create({ data: { email, displayName: email } });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };
  const overview = (token: string) =>
    request(app.getHttpServer())
      .get('/api/v1/stats/overview')
      .set('Authorization', `Bearer ${token}`);
  const addAttempts = async (
    userId: string,
    attempts: { cardId: string; isCorrect: boolean; daysAgo: number }[],
  ) => {
    const session = await prisma.studySession.create({
      data: { userId, setId, mode: 'WRITE' },
    });
    await prisma.attempt.createMany({
      data: attempts.map(({ cardId, isCorrect, daysAgo }) => ({
        sessionId: session.id,
        cardId,
        isCorrect,
        answer: 'x',
        timeMs: 1,
        createdAt: new Date(Date.now() - daysAgo * DAY_MS),
      })),
    });
  };

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    owner = await createUser('owner@example.com');
    other = await createUser('other@example.com');
    const set = await prisma.studySet.create({
      data: {
        ownerId: owner.id,
        title: 'Trái cây',
        visibility: 'PUBLIC',
        cardCount: 2,
        cards: {
          create: [
            { term: 'apple', definition: 'quả táo', position: 0 },
            { term: 'pear', definition: 'quả lê', position: 1 },
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

  it('trả 401 khi chưa đăng nhập', async () => {
    await request(app.getHttpServer()).get('/api/v1/stats/overview').expect(401);
  });

  it('trả số 0 khi chưa học', async () => {
    const { body } = await overview(owner.token).expect(200);

    expect(body.data).toEqual({
      streakDays: 0,
      masteredCards: 0,
      answersToday: 0,
      dueCards: 0,
      hardCards: [],
    });
  });

  it('đếm thẻ đến hạn và tiến độ theo bộ từ của người gọi', async () => {
    const [apple, pear] = [cardIds[0]!, cardIds[1]!];
    const past = new Date(Date.now() - DAY_MS);
    await prisma.cardProgress.createMany({
      data: [
        { userId: owner.id, cardId: apple, interval: MASTERED_INTERVAL_DAYS, dueAt: past },
        { userId: other.id, cardId: pear, interval: 1, dueAt: past },
      ],
    });

    expect((await overview(owner.token).expect(200)).body.data.dueCards).toBe(1);
    const { body } = await request(app.getHttpServer())
      .get(`/api/v1/stats/sets/${setId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);

    expect(body.data).toEqual({ total: 2, mastered: 1, learning: 0, notStarted: 1, due: 1 });
  });

  it('trả 404 khi không xem được bộ từ', async () => {
    await prisma.studySet.update({ where: { id: setId }, data: { visibility: 'PRIVATE' } });

    await request(app.getHttpServer())
      .get(`/api/v1/stats/sets/${setId}`)
      .set('Authorization', `Bearer ${other.token}`)
      .expect(404);
  });

  it('tổng hợp đúng dữ liệu của người gọi', async () => {
    const [apple, pear] = [cardIds[0]!, cardIds[1]!];
    await addAttempts(owner.id, [
      { cardId: apple, isCorrect: false, daysAgo: 0 },
      { cardId: pear, isCorrect: false, daysAgo: 0 },
      { cardId: pear, isCorrect: false, daysAgo: 1 },
      { cardId: pear, isCorrect: true, daysAgo: 2 },
    ]);
    await addAttempts(other.id, [{ cardId: apple, isCorrect: false, daysAgo: 0 }]);
    await prisma.cardProgress.createMany({
      data: [
        { userId: owner.id, cardId: apple, interval: MASTERED_INTERVAL_DAYS },
        { userId: owner.id, cardId: pear, interval: 1 },
        { userId: other.id, cardId: pear, interval: MASTERED_INTERVAL_DAYS },
      ],
    });

    const { body } = await overview(owner.token).expect(200);

    expect(body.data.streakDays).toBe(3);
    expect(body.data.masteredCards).toBe(1);
    expect(body.data.answersToday).toBeGreaterThanOrEqual(2);
    expect(body.data.hardCards).toEqual([
      { cardId: pear, setId, term: 'pear', definition: 'quả lê', wrongCount: 2 },
      { cardId: apple, setId, term: 'apple', definition: 'quả táo', wrongCount: 1 },
    ]);
  });

  it('bỏ qua thẻ của bộ từ đã xoá', async () => {
    await addAttempts(owner.id, [{ cardId: cardIds[0]!, isCorrect: false, daysAgo: 0 }]);
    await prisma.studySet.update({ where: { id: setId }, data: { deletedAt: new Date() } });

    const { body } = await overview(owner.token).expect(200);

    expect(body.data.hardCards).toEqual([]);
    expect(body.data.streakDays).toBe(1);
  });
});
