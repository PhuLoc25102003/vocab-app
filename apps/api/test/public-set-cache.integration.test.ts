import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { Role } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';
import { FakeRedis } from './support/fake-redis';

describe('cache bộ từ công khai', () => {
  const redis = new FakeRedis();
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let owner: { id: string; token: string };
  let admin: { id: string; token: string };
  let setId: string;

  const createUser = async (email: string, role: Role = 'STUDENT') => {
    const user = await prisma.user.create({ data: { email, displayName: email, role } });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };
  const server = () => request(app.getHttpServer());
  const asGuest = () => server().get(`/api/v1/sets/${setId}`);
  const as = (token: string) => (call: request.Test) =>
    call.set('Authorization', `Bearer ${token}`);
  /** Sửa thẳng database, nếu khách vẫn thấy dữ liệu cũ thì response đến từ cache. */
  const renameInDatabase = (title: string) =>
    prisma.studySet.update({ where: { id: setId }, data: { title } });

  beforeAll(async () => {
    app = await createTestApp({}, {}, { redis });
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    redis.failing = false;
    owner = await createUser('owner@example.com');
    admin = await createUser('admin@example.com', 'ADMIN');
    const set = await prisma.studySet.create({
      data: {
        ownerId: owner.id,
        title: 'Trái cây',
        visibility: 'PUBLIC',
        cardCount: 1,
        cards: { create: { position: 0, term: 'apple', definition: 'quả táo' } },
      },
    });
    setId = set.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('khách đọc từ cache, chủ bộ từ và ADMIN đọc database', async () => {
    await asGuest().expect(200);
    await renameInDatabase('Tên mới');

    expect((await asGuest().expect(200)).body.data.title).toBe('Trái cây');
    const mine = await as(owner.token)(server().get(`/api/v1/sets/${setId}`)).expect(200);
    expect(mine.body.data).toMatchObject({ title: 'Tên mới', folderId: null });
    const byAdmin = await as(admin.token)(server().get(`/api/v1/sets/${setId}`)).expect(200);
    expect(byAdmin.body.data.title).toBe('Tên mới');
    // Response từ cache giống hệt response từ database, không lộ thư mục.
    expect((await asGuest()).body.data).not.toHaveProperty('folderId');
  });

  it('chuyển sang riêng tư thì khách không còn đọc được từ cache', async () => {
    await asGuest().expect(200);

    await as(owner.token)(server().patch(`/api/v1/sets/${setId}`))
      .send({ visibility: 'PRIVATE' })
      .expect(200);

    await asGuest().expect(404);
  });

  it('sửa thẻ, ADMIN ẩn bộ và xoá bộ đều xoá cache', async () => {
    await asGuest().expect(200);
    await as(owner.token)(server().put(`/api/v1/sets/${setId}/cards`))
      .send({ cards: [{ term: 'pear', definition: 'quả lê' }] })
      .expect(200);
    expect((await asGuest().expect(200)).body.data.cards[0].term).toBe('pear');

    await as(admin.token)(server().patch(`/api/v1/admin/sets/${setId}/hide`))
      .send({ reason: 'Nội dung không phù hợp' })
      .expect(200);
    await asGuest().expect(404);

    await as(admin.token)(server().patch(`/api/v1/admin/sets/${setId}/unhide`)).expect(200);
    await asGuest().expect(200);
    await as(owner.token)(server().delete(`/api/v1/sets/${setId}`)).expect(204);
    await asGuest().expect(404);
  });

  it('chủ đổi tên hoặc xoá tài khoản thì bộ từ trong cache được xoá', async () => {
    await asGuest().expect(200);

    await as(owner.token)(server().patch('/api/v1/users/me'))
      .send({ displayName: 'Cô Lan' })
      .expect(200);
    expect((await asGuest().expect(200)).body.data.owner).toEqual({ displayName: 'Cô Lan' });

    await as(owner.token)(server().delete('/api/v1/users/me')).send({}).expect(204);
    await asGuest().expect(404);
  });

  it('không cache bộ riêng tư, Redis lỗi thì vẫn đọc database', async () => {
    await prisma.studySet.update({ where: { id: setId }, data: { visibility: 'PRIVATE' } });
    await as(owner.token)(server().get(`/api/v1/sets/${setId}`)).expect(200);
    await prisma.studySet.update({ where: { id: setId }, data: { visibility: 'PUBLIC' } });
    await renameInDatabase('Đã công khai');
    expect((await asGuest().expect(200)).body.data.title).toBe('Đã công khai');

    redis.failing = true;
    await renameInDatabase('Redis lỗi');
    expect((await asGuest().expect(200)).body.data.title).toBe('Redis lỗi');
  });
});
