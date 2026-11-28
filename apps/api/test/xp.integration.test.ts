import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FLASHCARD_ANSWERS, XP_RULES } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const { known } = FLASHCARD_ANSWERS;

describe('XP', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let user: { id: string; token: string };
  let setId: string;
  let cardIds: string[];

  const server = () => request(app.getHttpServer());
  /** Đáp án đúng nghĩa của từng thẻ, để chấm ở chế độ Viết. */
  const termOf = new Map<string, string>();
  const answer = (questionId: string, value: string, timeMs = 1000) => ({
    questionId,
    value,
    timeMs,
  });
  const ok = (cardId: string) => answer(cardId, termOf.get(cardId)!);
  const bad = (cardId: string) => answer(cardId, 'sai');
  // XP được kiểm chứng tính ở chế độ Viết; Xem thẻ tự chấm có luật riêng.
  const startSession = async (mode: 'WRITE' | 'FLASHCARD' = 'WRITE') => {
    const response = await server()
      .post('/api/v1/study/sessions')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ setId, mode })
      .expect(201);
    return (response.body as { data: { session: { id: string } } }).data.session.id;
  };
  const submit = (id: string, answers: object[]) =>
    server()
      .post(`/api/v1/study/sessions/${id}/answers`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ answers })
      .expect(200);
  const summary = () =>
    server().get('/api/v1/stats/xp').set('Authorization', `Bearer ${user.token}`).expect(200);

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    const created = await prisma.user.create({
      data: { email: 'xp@example.com', displayName: 'XP' },
    });
    user = { id: created.id, token: await app.get(AccessTokenService).sign(created) };
    const terms = ['one', 'two', 'three', 'four', 'five', 'six'];
    const set = await prisma.studySet.create({
      data: {
        ownerId: user.id,
        title: 'Số đếm',
        cardCount: terms.length,
        cards: {
          create: terms.map((term, position) => ({ term, definition: term, position })),
        },
      },
      include: { cards: { orderBy: { position: 'asc' } } },
    });
    setId = set.id;
    cardIds = set.cards.map(({ id }) => id);
    termOf.clear();
    for (const { id, term } of set.cards) termOf.set(id, term);
  });

  afterAll(async () => {
    await app.close();
  });

  it('trả 401 khi chưa đăng nhập', async () => {
    await server().get('/api/v1/stats/xp').expect(401);
  });

  it('người mới có 0 XP, cấp 1 và mục tiêu mặc định', async () => {
    const { body } = await summary();
    expect(body.data).toEqual({
      totalXp: 0,
      level: 1,
      xpIntoLevel: 0,
      xpForNextLevel: 100,
      todayXp: 0,
      dailyGoalXp: 100,
    });
  });

  it('cộng XP cho câu đúng, thưởng chuỗi 5 câu nối qua nhiều lô', async () => {
    const id = await startSession();
    const first = await submit(id, [ok(cardIds[0]!), ok(cardIds[1]!), bad(cardIds[2]!)]);
    expect(first.body.data.xpEarned).toBe(2 * XP_RULES.correct);

    const second = await submit(id, [ok(cardIds[3]!), ok(cardIds[4]!), ok(cardIds[5]!)]);
    // Câu sai ở lô đầu làm đứt chuỗi nên chưa đủ 5 câu liên tiếp.
    expect(second.body.data.xpEarned).toBe(3 * XP_RULES.correct);

    const { body } = await summary();
    expect(body.data).toMatchObject({ totalXp: 50, todayXp: 50, level: 1, xpIntoLevel: 50 });
  });

  it('đếm đủ chuỗi dài hơn 5 câu qua nhiều lô để thưởng đúng ở câu thứ 10', async () => {
    const extra = await Promise.all(
      ['seven', 'eight', 'nine', 'ten'].map((term, index) =>
        prisma.card.create({ data: { setId, term, definition: term, position: 6 + index } }),
      ),
    );
    for (const { id, term } of extra) termOf.set(id, term);
    const ids = [...cardIds, ...extra.map(({ id }) => id)];
    const id = await startSession();
    // 7 câu đúng liên tiếp: thưởng ở câu thứ 5.
    const first = await submit(
      id,
      ids.slice(0, 7).map((cardId) => ok(cardId)),
    );
    expect(first.body.data.xpEarned).toBe(7 * XP_RULES.correct + XP_RULES.comboBonus);
    // Thêm 3 câu đúng là đủ 10 câu liên tiếp: thưởng lần nữa.
    const second = await submit(
      id,
      ids.slice(7, 10).map((cardId) => ok(cardId)),
    );
    expect(second.body.data.xpEarned).toBe(3 * XP_RULES.correct + XP_RULES.comboBonus);
  });

  it('không cộng lại khi gửi lại cùng lô hoặc trả lời đúng lại trong 10 phút', async () => {
    const id = await startSession();
    const batch = [ok(cardIds[0]!)];
    expect((await submit(id, batch)).body.data.xpEarned).toBe(XP_RULES.correct);
    expect((await submit(id, batch)).body.data.xpEarned).toBe(0);

    const again = await startSession();
    expect((await submit(again, batch)).body.data.xpEarned).toBe(0);
    expect(await prisma.xpEvent.count({ where: { userId: user.id } })).toBe(1);
  });

  it('thưởng thêm khi trả lời đúng thẻ đã đến hạn', async () => {
    await prisma.cardProgress.create({
      data: {
        userId: user.id,
        cardId: cardIds[0]!,
        reps: 2,
        interval: 3,
        dueAt: new Date(Date.now() - 60_000),
        lastResult: true,
        updatedAt: new Date(Date.now() - 3 * 86_400_000),
      },
    });
    const id = await startSession();
    const { body } = await submit(id, [ok(cardIds[0]!)]);
    expect(body.data.xpEarned).toBe(XP_RULES.correct + XP_RULES.dueBonus);
  });

  it('Xem thẻ tự chấm: mỗi thẻ biết chỉ +2 XP, không thưởng chuỗi, lật quá nhanh thì không có', async () => {
    const id = await startSession('FLASHCARD');
    const slow = XP_RULES.selfGradedMinMs;
    const { body } = await submit(
      id,
      cardIds.slice(0, 5).map((cardId) => answer(cardId, known, slow)),
    );
    expect(body.data.xpEarned).toBe(5 * XP_RULES.selfGraded);

    const fast = await submit(id, [answer(cardIds[5]!, known, slow - 1)]);
    expect(fast.body.data.xpEarned).toBe(0);
    expect(fast.body.data.results[0].isCorrect).toBe(true);
  });

  it('kết thúc phiên trả tổng XP của phiên', async () => {
    const id = await startSession();
    await submit(id, [ok(cardIds[0]!)]);
    await submit(id, [ok(cardIds[1]!)]);
    const { body } = await server()
      .patch(`/api/v1/study/sessions/${id}/finish`)
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);
    expect(body.data.xpEarned).toBe(2 * XP_RULES.correct);
  });

  it('đổi mục tiêu ngày, từ chối giá trị ngoài 50, 100, 200, 300', async () => {
    const goal = (dailyGoalXp: unknown) =>
      server()
        .put('/api/v1/stats/xp/goal')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ dailyGoalXp });
    expect((await goal(200).expect(200)).body.data.dailyGoalXp).toBe(200);
    expect((await summary()).body.data.dailyGoalXp).toBe(200);
    await goal(20).expect(400);
    await goal('100').expect(400);
  });

  it('dừng ở trần XP của ngày', async () => {
    await prisma.xpEvent.create({ data: { userId: user.id, amount: XP_RULES.dailyCap - 5 } });
    const id = await startSession();
    const { body } = await submit(id, [ok(cardIds[0]!)]);
    expect(body.data.xpEarned).toBe(5);
    expect((await summary()).body.data.todayXp).toBe(XP_RULES.dailyCap);
  });
});
