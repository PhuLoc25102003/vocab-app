import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FLASHCARD_ANSWERS, toStudyDay, toStudyWeek } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const DAY_MS = 86_400_000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS);

describe('Thẻ giữ chuỗi', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let user: { id: string; token: string };
  let setId: string;
  let cardId: string;

  const server = () => request(app.getHttpServer());
  const overview = async () =>
    (
      await server()
        .get('/api/v1/stats/overview')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200)
    ).body.data as { streakDays: number; streakFreezes: number; frozenDays: string[] };
  const studiedOn = async (...days: number[]) => {
    const session = await prisma.studySession.create({
      data: { userId: user.id, setId, mode: 'FLASHCARD' },
    });
    await prisma.attempt.createMany({
      data: days.map((day) => ({
        sessionId: session.id,
        cardId,
        answer: 'known',
        isCorrect: true,
        timeMs: 1,
        createdAt: daysAgo(day),
      })),
    });
  };

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    const created = await prisma.user.create({
      data: { email: 'streak@example.com', displayName: 'Streak' },
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

  it('tài khoản mới có sẵn 1 thẻ', async () => {
    expect(await overview()).toMatchObject({ streakDays: 0, streakFreezes: 1, frozenDays: [] });
  });

  it('bỏ lỡ đúng hôm qua thì tự dùng thẻ, chuỗi không đứt', async () => {
    await studiedOn(3, 2);
    const yesterday = toStudyDay(daysAgo(1));

    expect(await overview()).toMatchObject({
      streakDays: 2,
      streakFreezes: 0,
      frozenDays: [yesterday],
    });
    // Mở lại không dùng thêm thẻ.
    expect((await overview()).streakFreezes).toBe(0);
  });

  it('bỏ lỡ hai ngày liền thì chuỗi về 0 và không dùng thẻ', async () => {
    await studiedOn(4, 3);
    expect(await overview()).toMatchObject({ streakDays: 0, streakFreezes: 1, frozenDays: [] });
  });

  it('học hôm nay sau khi bỏ lỡ hôm qua thì dùng thẻ ngay khi gửi đáp án', async () => {
    await studiedOn(2);
    const { body } = await server()
      .post('/api/v1/study/sessions')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ setId, mode: 'FLASHCARD' })
      .expect(201);
    await server()
      .post(`/api/v1/study/sessions/${body.data.session.id as string}/answers`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ answers: [{ questionId: cardId, value: FLASHCARD_ANSWERS.known, timeMs: 1 }] })
      .expect(200);

    expect(await prisma.streakFreezeDay.count({ where: { userId: user.id } })).toBe(1);
    expect(await overview()).toMatchObject({ streakDays: 2, streakFreezes: 0 });
  });

  it('cấp thêm thẻ mỗi thứ Hai, giữ tối đa 2', async () => {
    const twoWeeksAgo = toStudyWeek(daysAgo(14));
    await prisma.user.update({
      where: { id: user.id },
      data: { streakFreezes: 0, streakFreezeWeek: twoWeeksAgo },
    });
    expect((await overview()).streakFreezes).toBe(2);
    const saved = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(saved.streakFreezeWeek).toBe(toStudyWeek(new Date()));
  });
});
