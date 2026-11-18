import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES, MAX_CARDS_PER_SET, type Role } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { CARD_BODY_LIMIT_BYTES } from '../src/config/body-limit';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const LARGE_TEST_TIMEOUT_MS = 30_000;

describe('PUT /sets/:id/cards', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let owner: { id: string; token: string };
  let other: { id: string; token: string };
  let admin: { id: string; token: string };
  let setId: string;
  let apple: string;
  let banana: string;

  const createUser = async (email: string, role: Role = 'STUDENT') => {
    const user = await prisma.user.create({ data: { email, displayName: email, role } });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };
  const put = (cards: object[], token = owner.token, id = setId) =>
    request(app.getHttpServer())
      .put(`/api/v1/sets/${id}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ cards });
  const storedCards = () =>
    prisma.card.findMany({ where: { setId }, orderBy: { position: 'asc' } });
  const cardCount = async () =>
    (await prisma.studySet.findUniqueOrThrow({ where: { id: setId } })).cardCount;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    owner = await createUser('owner@example.com');
    other = await createUser('other@example.com');
    admin = await createUser('admin@example.com', 'ADMIN');
    const set = await prisma.studySet.create({
      data: {
        ownerId: owner.id,
        title: 'Trái cây',
        cardCount: 2,
        cards: {
          create: [
            { term: 'apple', definition: 'quả táo', position: 0, phonetic: '/ˈæp.əl/' },
            { term: 'banana', definition: 'quả chuối', position: 1, imageUrl: 'https://a.test/b' },
          ],
        },
      },
      include: { cards: { orderBy: { position: 'asc' } } },
    });
    setId = set.id;
    [apple, banana] = set.cards.map(({ id }) => id) as [string, string];
  });

  afterAll(async () => {
    await app.close();
  });

  it('thêm, sửa, xoá, đổi thứ tự và giữ tiến độ của thẻ còn lại', async () => {
    await prisma.cardProgress.createMany({
      data: [
        { userId: owner.id, cardId: apple, reps: 3 },
        { userId: owner.id, cardId: banana, reps: 1 },
      ],
    });

    const response = await put([
      { term: 'cherry', definition: 'quả anh đào' },
      { id: banana, term: 'banana', definition: 'chuối' },
    ]).expect(200);

    expect(response.body.data.cardCount).toBe(2);
    expect(response.body.data.cards.map(({ term }: { term: string }) => term)).toEqual([
      'cherry',
      'banana',
    ]);
    const cards = await storedCards();
    expect(cards.map(({ term, position }) => [term, position])).toEqual([
      ['cherry', 0],
      ['banana', 1],
    ]);
    expect(cards[1]).toMatchObject({
      id: banana,
      definition: 'chuối',
      imageUrl: 'https://a.test/b',
    });
    expect(await cardCount()).toBe(2);
    const progress = await prisma.cardProgress.findMany();
    expect(progress).toHaveLength(1);
    expect(progress[0]).toMatchObject({ cardId: banana, reps: 1 });
  });

  it('xoá trường tuỳ chọn bị bỏ và không đụng thẻ không đổi', async () => {
    const [before] = await storedCards();

    await put([
      { id: apple, term: 'apple', definition: 'quả táo', phonetic: '/ˈæp.əl/' },
      { id: banana, term: 'banana', definition: 'quả chuối', example: 'Ví dụ' },
    ]).expect(200);
    const [unchanged, changed] = await storedCards();
    expect(unchanged?.updatedAt).toEqual(before?.updatedAt);
    expect(changed?.example).toBe('Ví dụ');

    await put([
      { id: apple, term: 'apple', definition: 'quả táo' },
      { id: banana, term: 'banana', definition: 'quả chuối' },
    ]).expect(200);
    const [first, second] = await storedCards();
    expect(first?.phonetic).toBeNull();
    expect(second?.example).toBeNull();
  });

  it('danh sách rỗng xoá hết thẻ', async () => {
    const response = await put([]).expect(200);

    expect(response.body.data).toMatchObject({ cardCount: 0, cards: [] });
    expect(await storedCards()).toEqual([]);
  });

  it('từ chối id của bộ từ khác và không đổi gì', async () => {
    const foreign = await prisma.studySet.create({
      data: {
        ownerId: other.id,
        title: 'Khác',
        cards: { create: { term: 'x', definition: 'y', position: 0 } },
      },
      include: { cards: true },
    });
    const foreignId = foreign.cards[0]?.id;
    const before = await storedCards();

    const response = await put([
      { term: 'mới', definition: 'thẻ mới' },
      { id: foreignId, term: 'chiếm', definition: 'thẻ của người khác' },
    ]).expect(422);

    expect(response.body.error.code).toBe(ERROR_CODES.CARD_NOT_IN_SET);
    expect(response.body.error.details[0].path).toBe('cards.1.id');
    expect(await storedCards()).toEqual(before);
    expect(await cardCount()).toBe(2);
    expect(await prisma.card.findUniqueOrThrow({ where: { id: foreignId } })).toMatchObject({
      term: 'x',
    });
  });

  it('từ chối dữ liệu sai', async () => {
    const card = { term: 'a', definition: 'b' };
    await put([
      { ...card, id: apple },
      { ...card, id: apple },
    ]).expect(400);
    await put([{ term: 'a'.repeat(201), definition: 'b' }]).expect(400);
    await put([{ term: 'a', definition: 'b'.repeat(1001) }]).expect(400);
    await put(Array.from({ length: MAX_CARDS_PER_SET + 1 }, () => card)).expect(400);

    expect(await cardCount()).toBe(2);
  });

  it('kiểm tra đăng nhập và quyền sở hữu', async () => {
    const card = { term: 'a', definition: 'b' };
    await request(app.getHttpServer())
      .put(`/api/v1/sets/${setId}/cards`)
      .send({ cards: [card] })
      .expect(401);
    await put([card], other.token).expect(403);
    await put([card], owner.token, 'khong-co').expect(404);
    await put([card], admin.token).expect(200);

    await prisma.studySet.update({ where: { id: setId }, data: { deletedAt: new Date() } });
    await put([card]).expect(404);
  });

  it('hai lần lưu cùng lúc không làm lệch cardCount', async () => {
    const one = [{ term: 'a', definition: 'b' }];
    const three = [...one, ...one, ...one];

    await Promise.all([put(one).expect(200), put(three).expect(200)]);

    expect(await cardCount()).toBe((await storedCards()).length);
  });

  it(
    'lưu và sắp xếp lại được bộ tối đa, body lớn hơn 1 MB',
    async () => {
      const definition = 'đ'.repeat(400);
      const created = await put(
        Array.from({ length: MAX_CARDS_PER_SET }, (_, index) => ({
          term: `term-${index}`,
          definition,
        })),
      ).expect(200);
      const cards = created.body.data.cards as { id: string; term: string }[];

      const reversed = cards.map(({ id, term }) => ({ id, term, definition })).reverse();
      const response = await put(reversed).expect(200);

      expect(response.body.data.cardCount).toBe(MAX_CARDS_PER_SET);
      expect(response.body.data.cards[0].id).toBe(cards.at(-1)?.id);
    },
    LARGE_TEST_TIMEOUT_MS,
  );

  describe('giới hạn body', () => {
    // Dùng inject vì server đóng kết nối ngay khi trả 413, client thật có thể chưa gửi xong.
    const send = (method: 'PUT' | 'POST' | 'PATCH', url: string, bytes: number) =>
      app.inject({
        method,
        url: `/api/v1${url}`,
        headers: { authorization: `Bearer ${owner.token}`, 'content-type': 'application/json' },
        payload: JSON.stringify({ title: 'Bộ từ', description: 'x', padding: 'x'.repeat(bytes) }),
      });
    const ONE_MEGABYTE = 1024 * 1024;

    it('trả 413 khi vượt giới hạn của route lưu thẻ', async () => {
      const response = await send('PUT', `/sets/${setId}/cards`, CARD_BODY_LIMIT_BYTES);

      expect(response.statusCode).toBe(413);
      expect(response.json().error.code).toBe(ERROR_CODES.PAYLOAD_TOO_LARGE);
    });

    it('POST /sets nhận body trên 1 MB, route khác vẫn giữ 1 MB', async () => {
      expect((await send('POST', '/sets', 2 * ONE_MEGABYTE)).statusCode).toBe(201);
      expect((await send('PATCH', `/sets/${setId}`, 2 * ONE_MEGABYTE)).statusCode).toBe(413);
    });
  });
});
