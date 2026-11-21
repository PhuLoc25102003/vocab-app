import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES, MAX_CARDS_PER_SET, type Role } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const LARGE_TEST_TIMEOUT_MS = 30_000;

describe('POST /sets/:id/import', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let owner: { id: string; token: string };
  let other: { id: string; token: string };
  let admin: { id: string; token: string };
  let setId: string;

  const createUser = async (email: string, role: Role = 'STUDENT') => {
    const user = await prisma.user.create({ data: { email, displayName: email, role } });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };
  const cards = (count: number, prefix = 'w') =>
    Array.from({ length: count }, (_, i) => ({ term: `${prefix}${i}`, definition: `nghĩa ${i}` }));
  const importCards = (body: object, token = owner.token, id = setId) =>
    request(app.getHttpServer())
      .post(`/api/v1/sets/${id}/import`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  const storedTerms = async () =>
    (await prisma.card.findMany({ where: { setId }, orderBy: { position: 'asc' } })).map(
      ({ term, position }) => [position, term],
    );
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
        visibility: 'PUBLIC',
        cardCount: 1,
        cards: { create: [{ term: 'apple', definition: 'quả táo', position: 0 }] },
      },
    });
    setId = set.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('thêm thẻ vào cuối bộ từ và cập nhật cardCount', async () => {
    const response = await importCards({
      cards: [
        { term: 'banana', definition: 'quả chuối', phonetic: '/bəˈnɑːnə/' },
        { term: 'cherry', definition: 'quả anh đào' },
      ],
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ id: setId, cardCount: 3, imported: 2 });
    expect(await storedTerms()).toEqual([
      [0, 'apple'],
      [1, 'banana'],
      [2, 'cherry'],
    ]);
    expect(await cardCount()).toBe(3);
  });

  it('cần đăng nhập và chỉ chủ hoặc ADMIN được nhập', async () => {
    const guest = await request(app.getHttpServer())
      .post(`/api/v1/sets/${setId}/import`)
      .send({ cards: cards(1) });
    const stranger = await importCards({ cards: cards(1) }, other.token);
    const byAdmin = await importCards({ cards: cards(1) }, admin.token);

    expect(guest.status).toBe(401);
    expect(stranger.status).toBe(403);
    expect(byAdmin.status).toBe(201);
    expect(await cardCount()).toBe(2);
  });

  it('bộ từ đã xoá trả 404, danh sách rỗng hoặc thẻ sai trả 400', async () => {
    const empty = await importCards({ cards: [] });
    const invalid = await importCards({ cards: [{ term: 'x', definition: '' }] });
    await prisma.studySet.update({ where: { id: setId }, data: { deletedAt: new Date() } });
    const deleted = await importCards({ cards: cards(1) });

    expect(empty.status).toBe(400);
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(deleted.status).toBe(404);
    expect(deleted.body.error.code).toBe(ERROR_CODES.SET_NOT_FOUND);
  });

  it(
    `không lưu gì khi tổng số thẻ vượt ${MAX_CARDS_PER_SET}`,
    async () => {
      const response = await importCards({ cards: cards(MAX_CARDS_PER_SET) });

      expect(response.status).toBe(422);
      expect(response.body.error).toMatchObject({
        code: ERROR_CODES.SET_CARD_LIMIT,
        details: { max: MAX_CARDS_PER_SET, current: 1, adding: MAX_CARDS_PER_SET },
      });
      expect(await cardCount()).toBe(1);
      expect(await prisma.card.count({ where: { setId } })).toBe(1);
    },
    LARGE_TEST_TIMEOUT_MS,
  );

  it(
    'hai lần nhập cùng lúc không vượt giới hạn và không trùng vị trí',
    async () => {
      const half = (MAX_CARDS_PER_SET - 1) / 2 + 1;
      const [first, second] = await Promise.all([
        importCards({ cards: cards(Math.floor(half), 'a') }),
        importCards({ cards: cards(Math.floor(half), 'b') }),
      ]);

      expect([first.status, second.status].sort()).toEqual([201, 422]);
      const positions = (await storedTerms()).map(([position]) => position);
      expect(new Set(positions).size).toBe(positions.length);
      expect(await cardCount()).toBe(positions.length);
    },
    LARGE_TEST_TIMEOUT_MS,
  );
});
