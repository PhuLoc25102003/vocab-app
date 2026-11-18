import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES, type Role } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const BASE = '/api/v1/sets';

describe('bộ từ', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let owner: { id: string; token: string };
  let other: { id: string; token: string };
  let admin: { id: string; token: string };

  const createUser = async (email: string, role: Role = 'STUDENT') => {
    const user = await prisma.user.create({ data: { email, displayName: email, role } });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };
  const call = (method: 'get' | 'post' | 'patch' | 'delete', path: string, token: string) =>
    request(app.getHttpServer())[method](`${BASE}${path}`).set('Authorization', `Bearer ${token}`);
  const seedSet = (ownerId: string, title = 'Bộ từ', extra: object = {}) =>
    prisma.studySet.create({ data: { ownerId, title, ...extra } });

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

  it('cần đăng nhập', async () => {
    const { id } = await seedSet(owner.id);
    const server = request(app.getHttpServer());

    await server.get(BASE).expect(401);
    await server.post(BASE).send({ title: 'A' }).expect(401);
    await server.patch(`${BASE}/${id}`).send({ title: 'B' }).expect(401);
    await server.delete(`${BASE}/${id}`).expect(401);
  });

  describe('POST /sets', () => {
    it('tạo bộ từ kèm thẻ đúng thứ tự, chủ là người gọi', async () => {
      const response = await call('post', '', owner.token)
        .send({
          title: ' Trái cây ',
          ownerId: other.id,
          cardCount: 99,
          cards: [
            { term: 'apple', definition: 'quả táo', phonetic: '/ˈæp.əl/' },
            { term: 'pear', definition: 'quả lê' },
          ],
        })
        .expect(201);

      expect(response.body.data).toMatchObject({
        title: 'Trái cây',
        ownerId: owner.id,
        cardCount: 2,
        visibility: 'PRIVATE',
        termLang: 'en',
        defLang: 'vi',
      });
      const cards = await prisma.card.findMany({
        where: { setId: response.body.data.id },
        orderBy: { position: 'asc' },
      });
      expect(cards.map(({ term, position }) => [term, position])).toEqual([
        ['apple', 0],
        ['pear', 1],
      ]);
    });

    it('trả 400 và không tạo gì khi có thẻ sai', async () => {
      const response = await call('post', '', owner.token)
        .send({ title: 'A', cards: [{ term: 'apple', definition: '' }] })
        .expect(400);

      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(response.body.error.details[0].path).toBe('cards.0.definition');
      expect(await prisma.studySet.count()).toBe(0);
    });
  });

  describe('GET /sets', () => {
    it('chỉ trả bộ từ của tôi chưa xoá, có phân trang', async () => {
      await seedSet(owner.id, 'B');
      await seedSet(owner.id, 'A');
      await seedSet(owner.id, 'C');
      await seedSet(owner.id, 'Đã xoá', { deletedAt: new Date() });
      await seedSet(other.id, 'Của người khác', { visibility: 'PUBLIC' });

      const response = await call('get', '?sort=title&limit=2', owner.token).expect(200);

      expect(response.body.data.map(({ title }: { title: string }) => title)).toEqual(['A', 'B']);
      expect(response.body.meta).toEqual({ page: 1, limit: 2, total: 3 });
      expect(response.body.data[0]).not.toHaveProperty('deletedAt');
    });

    it('sắp xếp giảm dần bằng dấu trừ', async () => {
      await seedSet(owner.id, 'A');
      await seedSet(owner.id, 'B');

      const response = await call('get', '?sort=-title', owner.token).expect(200);

      expect(response.body.data[0].title).toBe('B');
    });

    it.each(['ownerId', '-deletedAt', 'owner.passwordHash'])('từ chối sort=%s', async (sort) => {
      const response = await call('get', `?sort=${sort}`, owner.token).expect(400);

      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('PATCH /sets/:id', () => {
    it('chủ sửa được và xoá được mô tả', async () => {
      const { id } = await seedSet(owner.id, 'Cũ', { description: 'Mô tả' });

      const response = await call('patch', `/${id}`, owner.token)
        .send({ title: 'Mới', description: null, visibility: 'PUBLIC' })
        .expect(200);

      expect(response.body.data).toMatchObject({
        title: 'Mới',
        description: null,
        visibility: 'PUBLIC',
      });
    });

    it('không đổi được chủ sở hữu', async () => {
      const { id } = await seedSet(owner.id);

      await call('patch', `/${id}`, owner.token)
        .send({ title: 'B', ownerId: other.id })
        .expect(200);

      expect((await prisma.studySet.findUniqueOrThrow({ where: { id } })).ownerId).toBe(owner.id);
    });

    it('trả 403 với người khác và cho phép ADMIN', async () => {
      const { id } = await seedSet(owner.id);

      await call('patch', `/${id}`, other.token).send({ title: 'B' }).expect(403);
      await call('patch', `/${id}`, admin.token).send({ title: 'C' }).expect(200);
    });

    it('trả 400 khi không có thay đổi', async () => {
      const { id } = await seedSet(owner.id);

      await call('patch', `/${id}`, owner.token).send({}).expect(400);
    });

    it('trả 404 khi bộ từ đã xoá, kể cả với ADMIN', async () => {
      const { id } = await seedSet(owner.id, 'A', { deletedAt: new Date() });

      for (const { token } of [owner, admin]) {
        const response = await call('patch', `/${id}`, token).send({ title: 'B' }).expect(404);
        expect(response.body.error.code).toBe(ERROR_CODES.SET_NOT_FOUND);
      }
    });
  });

  describe('DELETE /sets/:id', () => {
    it('xoá mềm, giữ lại dữ liệu và không xoá được lần hai', async () => {
      const { id } = await seedSet(owner.id);

      await call('delete', `/${id}`, owner.token).expect(204);

      expect((await prisma.studySet.findUniqueOrThrow({ where: { id } })).deletedAt).not.toBeNull();
      await call('delete', `/${id}`, owner.token).expect(404);
      await call('delete', `/${id}`, admin.token).expect(404);
    });

    it('trả 403 với người khác và cho phép ADMIN', async () => {
      const { id } = await seedSet(owner.id);

      await call('delete', `/${id}`, other.token).expect(403);
      await call('delete', `/${id}`, admin.token).expect(204);
    });
  });
});
