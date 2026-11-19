import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES, FLASHCARD_ANSWERS, SRS_CONFIG } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const { known, unknown } = FLASHCARD_ANSWERS;

describe('study sessions', () => {
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
  const server = () => request(app.getHttpServer());
  const start = (token: string, body: object) =>
    server().post('/api/v1/study/sessions').set('Authorization', `Bearer ${token}`).send(body);
  const submit = (id: string, token: string, answers: object[]) =>
    server()
      .post(`/api/v1/study/sessions/${id}/answers`)
      .set('Authorization', `Bearer ${token}`)
      .send({ answers });
  const finish = (id: string, token: string) =>
    server().patch(`/api/v1/study/sessions/${id}/finish`).set('Authorization', `Bearer ${token}`);
  const answer = (questionId: string, value: string) => ({ questionId, value, timeMs: 1200 });
  const startSession = async (token = owner.token): Promise<string> => {
    const response = await start(token, { setId, mode: 'FLASHCARD' }).expect(201);
    return (response.body as { data: { session: { id: string } } }).data.session.id;
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
        cardCount: 2,
        cards: {
          create: [
            { term: 'pear', definition: 'quả lê', position: 1 },
            { term: 'apple', definition: 'quả táo', position: 0 },
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

  describe('POST /study/sessions', () => {
    it('trả 401 khi chưa đăng nhập', async () => {
      await server().post('/api/v1/study/sessions').send({ setId, mode: 'FLASHCARD' }).expect(401);
    });

    it('tạo phiên và trả câu hỏi theo thứ tự thẻ', async () => {
      const { body } = await start(owner.token, { setId, mode: 'FLASHCARD' }).expect(201);

      expect(body.data.session).toMatchObject({ setId, mode: 'FLASHCARD', total: 2, correct: 0 });
      expect(body.data.session.finishedAt).toBeNull();
      expect(body.data.languages).toEqual({ term: 'en', definition: 'vi' });
      expect(body.data.questions.map((q: { prompt: string }) => q.prompt)).toEqual([
        'apple',
        'pear',
      ]);
    });

    it('trả đáp án lựa chọn cho chế độ Trắc nghiệm', async () => {
      const { body } = await start(owner.token, { setId, mode: 'MCQ' }).expect(201);

      expect([...body.data.questions[0].choices].sort()).toEqual(['quả lê', 'quả táo']);
    });

    it('giới hạn số câu hỏi', async () => {
      const { body } = await start(owner.token, { setId, mode: 'FLASHCARD', limit: 1 }).expect(201);

      expect(body.data.questions).toHaveLength(1);
      expect(body.data.session.total).toBe(1);
    });

    it('trả 400 khi dữ liệu sai', async () => {
      await start(owner.token, { setId, mode: 'UNKNOWN' }).expect(400);
    });

    it('trả 404 với bộ riêng tư của người khác', async () => {
      const { body } = await start(other.token, { setId, mode: 'FLASHCARD' }).expect(404);

      expect(body.error.code).toBe(ERROR_CODES.SET_NOT_FOUND);
    });

    it('cho học bộ công khai của người khác', async () => {
      await prisma.studySet.update({ where: { id: setId }, data: { visibility: 'PUBLIC' } });

      await start(other.token, { setId, mode: 'FLASHCARD' }).expect(201);
    });

    it('trả 422 khi chế độ chưa có', async () => {
      const { body } = await start(owner.token, { setId, mode: 'TEST' }).expect(422);

      expect(body.error.code).toBe(ERROR_CODES.STUDY_MODE_UNAVAILABLE);
    });

    it('chế độ Điền từ chỉ dùng thẻ có câu ví dụ chứa từ và chấm ở server', async () => {
      await prisma.card.update({
        where: { id: cardIds[0] },
        data: { example: 'An apple a day keeps the doctor away.' },
      });
      const started = await start(owner.token, { setId, mode: 'CLOZE' }).expect(201);

      expect(started.body.data.questions).toEqual([
        {
          id: cardIds[0],
          cardId: cardIds[0],
          mode: 'CLOZE',
          prompt: 'An _____ a day keeps the doctor away.',
          expected: 'apple',
          hint: 'quả táo',
        },
      ]);
      const { body } = await submit(started.body.data.session.id, owner.token, [
        answer(cardIds[0]!, 'Apple'),
      ]).expect(200);
      expect(body.data.results[0].isCorrect).toBe(true);
    });

    it('trả 422 khi không có thẻ phù hợp với chế độ', async () => {
      const { body } = await start(owner.token, { setId, mode: 'CLOZE' }).expect(422);

      expect(body.error.code).toBe(ERROR_CODES.NO_QUESTIONS_FOR_MODE);
    });

    it('trả 422 khi bộ từ chưa có thẻ', async () => {
      await prisma.card.deleteMany({ where: { setId } });

      const { body } = await start(owner.token, { setId, mode: 'FLASHCARD' }).expect(422);

      expect(body.error.code).toBe(ERROR_CODES.SET_HAS_NO_CARDS);
    });
  });

  describe('POST /study/sessions với cardIds', () => {
    it('chỉ tạo câu hỏi cho các thẻ được chọn trong bộ từ', async () => {
      const { body } = await start(owner.token, {
        setId,
        mode: 'FLASHCARD',
        cardIds: [cardIds[1]!, 'the-cua-bo-khac'],
      }).expect(201);

      expect(body.data.questions.map(({ cardId }: { cardId: string }) => cardId)).toEqual([
        cardIds[1],
      ]);
    });
  });

  describe('POST /study/sessions/:id/answers', () => {
    it('không tính hai lần khi cùng một lô được gửi lại', async () => {
      const id = await startSession();
      const batch = [answer(cardIds[0]!, known)];

      await submit(id, owner.token, batch).expect(200);
      const progress = await prisma.cardProgress.findFirstOrThrow({
        where: { userId: owner.id, cardId: cardIds[0]! },
      });
      await submit(id, owner.token, batch).expect(200);

      expect(await prisma.attempt.count({ where: { sessionId: id } })).toBe(1);
      expect(
        await prisma.cardProgress.findFirstOrThrow({
          where: { userId: owner.id, cardId: cardIds[0]! },
        }),
      ).toEqual(progress);
    });

    it('chấm đáp án, lưu lượt trả lời và cập nhật lịch ôn', async () => {
      const id = await startSession();

      const { body } = await submit(id, owner.token, [
        answer(cardIds[0]!, known),
        answer(cardIds[1]!, unknown),
      ]).expect(200);

      expect(body.data.ignored).toBe(0);
      expect(body.data.results).toEqual([
        { questionId: cardIds[0], isCorrect: true, expected: 'quả táo' },
        { questionId: cardIds[1], isCorrect: false, expected: 'quả lê' },
      ]);
      expect(await prisma.attempt.count({ where: { sessionId: id } })).toBe(2);
      const right = await prisma.cardProgress.findUniqueOrThrow({
        where: { userId_cardId: { userId: owner.id, cardId: cardIds[0]! } },
      });
      expect(right).toMatchObject({
        reps: 1,
        interval: SRS_CONFIG.firstIntervalDays,
        lastResult: true,
      });
      const wrong = await prisma.cardProgress.findUniqueOrThrow({
        where: { userId_cardId: { userId: owner.id, cardId: cardIds[1]! } },
      });
      expect(wrong).toMatchObject({ reps: 0, interval: 0, lastResult: false });
    });

    it('áp dụng đúng thứ tự khi một thẻ xuất hiện nhiều lần trong lô', async () => {
      const id = await startSession();

      await submit(id, owner.token, [
        answer(cardIds[0]!, unknown),
        answer(cardIds[0]!, known),
      ]).expect(200);

      const progress = await prisma.cardProgress.findUniqueOrThrow({
        where: { userId_cardId: { userId: owner.id, cardId: cardIds[0]! } },
      });
      expect(progress.lastResult).toBe(true);
      expect(progress.reps).toBe(0);
    });

    it('chấm lại đáp án chế độ Viết ở server', async () => {
      const started = await start(owner.token, { setId, mode: 'WRITE' }).expect(201);

      const { body } = await submit(started.body.data.session.id, owner.token, [
        answer(cardIds[0]!, ' APPLE '),
        answer(cardIds[1]!, 'peach'),
      ]).expect(200);

      expect(body.data.results.map((r: { isCorrect: boolean }) => r.isCorrect)).toEqual([
        true,
        false,
      ]);
    });

    it('bỏ qua câu hỏi không còn trong bộ từ', async () => {
      const id = await startSession();

      const { body } = await submit(id, owner.token, [
        answer('the-da-xoa', known),
        answer(cardIds[0]!, known),
      ]).expect(200);

      expect(body.data.ignored).toBe(1);
      expect(body.data.results).toHaveLength(1);
    });

    it('trả 400 khi lô rỗng', async () => {
      await submit(await startSession(), owner.token, []).expect(400);
    });

    it('trả 401 khi chưa đăng nhập', async () => {
      const id = await startSession();

      await server()
        .post(`/api/v1/study/sessions/${id}/answers`)
        .send({ answers: [answer(cardIds[0]!, known)] })
        .expect(401);
    });

    it('trả 403 với phiên của người khác', async () => {
      await submit(await startSession(), other.token, [answer(cardIds[0]!, known)]).expect(403);
    });

    it('trả 404 khi phiên không tồn tại', async () => {
      await submit('khong-co', owner.token, [answer(cardIds[0]!, known)]).expect(404);
    });

    it('trả 409 khi phiên đã kết thúc', async () => {
      const id = await startSession();
      await finish(id, owner.token).expect(200);

      const { body } = await submit(id, owner.token, [answer(cardIds[0]!, known)]).expect(409);

      expect(body.error.code).toBe(ERROR_CODES.STUDY_SESSION_FINISHED);
    });

    it('trả 404 khi bộ từ đã bị xoá trong lúc học', async () => {
      const id = await startSession();
      await prisma.studySet.update({ where: { id: setId }, data: { deletedAt: new Date() } });

      await submit(id, owner.token, [answer(cardIds[0]!, known)]).expect(404);
    });
  });

  describe('PATCH /study/sessions/:id/finish', () => {
    it('tính điểm theo lần trả lời đầu của mỗi thẻ', async () => {
      const id = await startSession();
      await submit(id, owner.token, [
        answer(cardIds[0]!, known),
        answer(cardIds[1]!, unknown),
        answer(cardIds[1]!, known),
      ]).expect(200);

      const { body } = await finish(id, owner.token).expect(200);

      expect(body.data.session).toMatchObject({ correct: 1, total: 2 });
      expect(body.data.session.finishedAt).toEqual(expect.any(String));
      expect(body.data.wrongCardIds).toEqual([cardIds[1]]);
    });

    it('gọi lại vẫn trả cùng kết quả', async () => {
      const id = await startSession();
      await submit(id, owner.token, [answer(cardIds[0]!, known)]).expect(200);

      const first = await finish(id, owner.token).expect(200);
      const second = await finish(id, owner.token).expect(200);

      expect(second.body).toEqual(first.body);
    });

    it('trả 401, 403 và 404 đúng trường hợp', async () => {
      const id = await startSession();

      await server().patch(`/api/v1/study/sessions/${id}/finish`).expect(401);
      await finish(id, other.token).expect(403);
      await finish('khong-co', owner.token).expect(404);
    });
  });
});
