import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const PAST = new Date('2020-01-01T00:00:00.000Z');
const FUTURE = new Date('2999-01-01T00:00:00.000Z');

describe('review due', () => {
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
  const listDue = (token: string) =>
    request(app.getHttpServer()).get('/api/v1/review/due').set('Authorization', `Bearer ${token}`);
  const startDue = (token: string) =>
    request(app.getHttpServer())
      .post('/api/v1/study/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ setId, mode: 'FLASHCARD', dueOnly: true });
  const setDue = (userId: string, cardId: string, dueAt: Date) =>
    prisma.cardProgress.create({ data: { userId, cardId, dueAt } });

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
        cardCount: 3,
        cards: {
          create: [
            { term: 'a', definition: 'một', position: 0 },
            { term: 'b', definition: 'hai', position: 1 },
            { term: 'c', definition: 'ba', position: 2 },
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
    await request(app.getHttpServer()).get('/api/v1/review/due').expect(401);
  });

  it('đếm thẻ đã đến hạn của đúng người gọi', async () => {
    await setDue(owner.id, cardIds[0]!, PAST);
    await setDue(owner.id, cardIds[1]!, FUTURE);
    await setDue(other.id, cardIds[2]!, PAST);

    const { body } = await listDue(owner.token).expect(200);

    expect(body.data).toEqual([{ setId, title: 'Trái cây', dueCount: 1 }]);
    expect(body.meta).toMatchObject({ page: 1, total: 1 });
    // Thẻ của người khác không được tính vào lần đến hạn tiếp theo.
    expect(body.summary).toEqual({ dueCards: 1, nextDueAt: FUTURE.toISOString() });
  });

  it('bỏ qua bộ từ đã xoá hoặc không còn xem được', async () => {
    await setDue(other.id, cardIds[0]!, PAST);

    const hidden = await listDue(other.token).expect(200);
    expect(hidden.body.data).toEqual([]);
    expect(hidden.body.summary).toEqual({ dueCards: 0, nextDueAt: null });

    await setDue(owner.id, cardIds[0]!, PAST);
    await prisma.studySet.update({ where: { id: setId }, data: { deletedAt: new Date() } });
    const deleted = await listDue(owner.token).expect(200);
    expect(deleted.body.data).toEqual([]);
  });

  it('phiên ôn chỉ gồm thẻ đến hạn', async () => {
    await setDue(owner.id, cardIds[1]!, PAST);
    await setDue(owner.id, cardIds[2]!, FUTURE);

    const { body } = await startDue(owner.token).expect(201);

    expect(body.data.questions.map((q: { cardId: string }) => q.cardId)).toEqual([cardIds[1]]);
    expect(body.data.session.total).toBe(1);
  });

  it('báo khi không còn thẻ đến hạn', async () => {
    const { body } = await startDue(owner.token).expect(422);

    expect(body.error.code).toBe(ERROR_CODES.NO_CARDS_DUE);
  });
});
