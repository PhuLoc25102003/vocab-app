import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { BADGES } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const DAY_MS = 86_400_000;

describe('Huy hiệu', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let user: { id: string; token: string };
  let setId: string;
  let cardId: string;

  const server = () => request(app.getHttpServer());
  const auth = (req: request.Test) => req.set('Authorization', `Bearer ${user.token}`);
  const finishedSession = async (mode: 'TEST' | 'FLASHCARD', correct: number, total: number) => {
    const session = await prisma.studySession.create({
      data: { userId: user.id, setId, mode, total, correct },
    });
    return session.id;
  };

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    const created = await prisma.user.create({
      data: { email: 'badge@example.com', displayName: 'Badge' },
    });
    user = { id: created.id, token: await app.get(AccessTokenService).sign(created) };
    const set = await prisma.studySet.create({
      data: {
        ownerId: user.id,
        title: 'Một thẻ',
        cardCount: 1,
        cards: { create: [{ term: 'one', definition: 'một', position: 0 }] },
      },
      include: { cards: true },
    });
    setId = set.id;
    cardId = set.cards[0]!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('trả 401 khi chưa đăng nhập', async () => {
    await server().get('/api/v1/stats/badges').expect(401);
  });

  it('liệt kê mọi huy hiệu kèm tiến độ, người mới chưa có huy hiệu nào', async () => {
    const { body } = await auth(server().get('/api/v1/stats/badges')).expect(200);
    expect(body.data).toHaveLength(BADGES.length);
    expect(body.data[0]).toEqual({
      code: 'mastered-100',
      progress: 0,
      target: 100,
      earnedAt: null,
    });
  });

  it('kết thúc phiên Kiểm tra đúng hết thì nhận huy hiệu một lần', async () => {
    const id = await finishedSession('TEST', 0, 0);
    await prisma.attempt.create({
      data: { sessionId: id, cardId, answer: 'one', isCorrect: true, timeMs: 1 },
    });

    const first = await auth(server().patch(`/api/v1/study/sessions/${id}/finish`)).expect(200);
    expect(first.body.data.newBadges).toContain('perfect-test');

    const again = await auth(server().patch(`/api/v1/study/sessions/${id}/finish`)).expect(200);
    expect(again.body.data.newBadges).toEqual([]);

    const { body } = await auth(server().get('/api/v1/stats/badges')).expect(200);
    const perfect = (body.data as { code: string; earnedAt: string | null }[]).find(
      ({ code }) => code === 'perfect-test',
    );
    expect(perfect?.earnedAt).not.toBeNull();
  });

  it('chuỗi 7 ngày cho huy hiệu streak-7', async () => {
    const id = await finishedSession('FLASHCARD', 0, 0);
    await prisma.attempt.createMany({
      data: Array.from({ length: 7 }, (_, day) => ({
        sessionId: id,
        cardId,
        answer: 'known',
        isCorrect: true,
        timeMs: 1,
        createdAt: new Date(Date.now() - day * DAY_MS),
      })),
    });
    const { body } = await auth(server().patch(`/api/v1/study/sessions/${id}/finish`)).expect(200);
    expect(body.data.newBadges).toContain('streak-7');
    expect(body.data.newBadges).not.toContain('streak-30');
  });
});
