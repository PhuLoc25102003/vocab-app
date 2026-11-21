import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES, SET_TITLE_MAX_LENGTH, type Role } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

describe('POST /sets/:id/duplicate', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let owner: { id: string; token: string };
  let other: { id: string; token: string };
  let admin: { id: string; token: string };

  const createUser = async (email: string, role: Role = 'STUDENT') => {
    const user = await prisma.user.create({ data: { email, displayName: email, role } });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };
  const duplicate = (id: string, token: string) =>
    request(app.getHttpServer())
      .post(`/api/v1/sets/${id}/duplicate`)
      .set('Authorization', `Bearer ${token}`);
  const seedSet = (title: string, extra: object = {}) =>
    prisma.studySet.create({ data: { ownerId: owner.id, title, ...extra } });

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    owner = await createUser('owner@example.com');
    other = await createUser('other@example.com');
    admin = await createUser('admin@example.com', 'ADMIN');
  });

  afterAll(async () => {
    await app.close();
  });

  it('sao chép bộ công khai thành bộ riêng tư của người gọi', async () => {
    const folder = await prisma.folder.create({ data: { ownerId: owner.id, name: 'Thư mục' } });
    const source = await seedSet('Trái cây', {
      description: 'Mô tả',
      termLang: 'ja',
      defLang: 'en',
      visibility: 'PUBLIC',
      folderId: folder.id,
      cardCount: 2,
      cards: {
        create: [
          { term: 'b', definition: 'hai', position: 1, imageUrl: 'https://a.test/b' },
          { term: 'a', definition: 'một', position: 0, phonetic: '/a/', example: 'Ví dụ' },
        ],
      },
    });
    const sourceCards = await prisma.card.findMany({ where: { setId: source.id } });
    await prisma.cardProgress.create({
      data: { userId: owner.id, cardId: sourceCards[0]?.id ?? '' },
    });

    const response = await duplicate(source.id, other.token).expect(201);

    expect(response.body.data).toMatchObject({
      ownerId: other.id,
      title: 'Trái cây (bản sao)',
      description: 'Mô tả',
      termLang: 'ja',
      defLang: 'en',
      visibility: 'PRIVATE',
      cardCount: 2,
    });
    expect(response.body.data.id).not.toBe(source.id);

    const copy = await prisma.studySet.findUniqueOrThrow({
      where: { id: response.body.data.id },
      include: { cards: { orderBy: { position: 'asc' } } },
    });
    expect(copy.folderId).toBeNull();
    expect(copy.cards).toMatchObject([
      { term: 'a', definition: 'một', position: 0, phonetic: '/a/', example: 'Ví dụ' },
      { term: 'b', definition: 'hai', position: 1, imageUrl: 'https://a.test/b' },
    ]);
    const sourceIds = sourceCards.map(({ id }) => id);
    expect(copy.cards.some(({ id }) => sourceIds.includes(id))).toBe(false);
    expect(await prisma.card.count({ where: { setId: source.id } })).toBe(2);
    expect(await prisma.cardProgress.count()).toBe(1);
  });

  it('giữ tên trong giới hạn và không cắt đôi ký tự', async () => {
    const suffixLength = ' (bản sao)'.length;
    const keptLength = SET_TITLE_MAX_LENGTH - suffixLength;
    const title = `${'a'.repeat(keptLength - 1)}😀${'b'.repeat(suffixLength - 1)}`;
    const source = await seedSet(title, { visibility: 'PUBLIC' });

    const response = await duplicate(source.id, other.token).expect(201);

    expect(response.body.data.title).toBe(`${'a'.repeat(keptLength - 1)} (bản sao)`);
    expect(response.body.data.title.length).toBeLessThanOrEqual(SET_TITLE_MAX_LENGTH);
  });

  it('sao chép được bộ không có thẻ và bộ riêng tư của chính mình', async () => {
    const source = await seedSet('Của tôi');

    const response = await duplicate(source.id, owner.token).expect(201);

    expect(response.body.data).toMatchObject({ ownerId: owner.id, cardCount: 0 });
  });

  it('ADMIN sao chép được bộ riêng tư về tài khoản của ADMIN', async () => {
    const source = await seedSet('Riêng');

    const response = await duplicate(source.id, admin.token).expect(201);

    expect(response.body.data.ownerId).toBe(admin.id);
  });

  it.each(['PRIVATE', 'CLASS'])('trả 404 với bộ %s của người khác', async (visibility) => {
    const source = await seedSet('Riêng', { visibility });

    const response = await duplicate(source.id, other.token).expect(404);

    expect(response.body.error.code).toBe(ERROR_CODES.SET_NOT_FOUND);
    expect(await prisma.studySet.count()).toBe(1);
  });

  it('trả 404 khi bộ đã xoá, chủ đã xoá tài khoản hoặc không tồn tại', async () => {
    const deleted = await seedSet('Đã xoá', { visibility: 'PUBLIC', deletedAt: new Date() });
    const orphaned = await seedSet('Chủ đã xoá', { visibility: 'PUBLIC' });
    await prisma.user.update({ where: { id: owner.id }, data: { deletedAt: new Date() } });

    await duplicate(deleted.id, other.token).expect(404);
    await duplicate(orphaned.id, other.token).expect(404);
    await duplicate('khong-co', other.token).expect(404);
  });

  it('trả 401 khi chưa đăng nhập', async () => {
    const source = await seedSet('Công khai', { visibility: 'PUBLIC' });

    await request(app.getHttpServer()).post(`/api/v1/sets/${source.id}/duplicate`).expect(401);
  });
});
