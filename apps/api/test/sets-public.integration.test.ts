import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES, type Role } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const BASE = '/api/v1/sets';

describe('xem bộ từ', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let owner: { id: string; token: string };
  let other: { id: string; token: string };
  let admin: { id: string; token: string };

  const createUser = async (email: string, role: Role = 'STUDENT') => {
    const user = await prisma.user.create({ data: { email, displayName: email, role } });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };
  const get = (path: string, token?: string) => {
    const call = request(app.getHttpServer()).get(`${BASE}${path}`);
    return token ? call.set('Authorization', `Bearer ${token}`) : call;
  };
  const seedSet = (title: string, extra: object = {}) =>
    prisma.studySet.create({ data: { ownerId: owner.id, title, ...extra } });
  const titles = (body: { data: { title: string }[] }) => body.data.map(({ title }) => title);

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

  describe('GET /sets/public', () => {
    it('khách chỉ thấy bộ công khai còn hoạt động, kèm tên chủ', async () => {
      await seedSet('Công khai', { visibility: 'PUBLIC' });
      await seedSet('Riêng tư');
      await seedSet('Lớp học', { visibility: 'CLASS' });
      await seedSet('Đã xoá', { visibility: 'PUBLIC', deletedAt: new Date() });

      const response = await get('/public').expect(200);

      expect(titles(response.body)).toEqual(['Công khai']);
      expect(response.body.meta.total).toBe(1);
      expect(response.body.data[0].owner).toEqual({ displayName: 'owner@example.com' });
      expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    });

    it('ẩn bộ từ của tài khoản đã xoá', async () => {
      await seedSet('Công khai', { visibility: 'PUBLIC' });
      await prisma.user.update({ where: { id: owner.id }, data: { deletedAt: new Date() } });

      expect((await get('/public').expect(200)).body.data).toEqual([]);
    });

    it('tìm theo tên, không phân biệt hoa thường', async () => {
      await seedSet('Trái cây', { visibility: 'PUBLIC' });
      await seedSet('Động vật', { visibility: 'PUBLIC' });

      const response = await get(`/public?q=${encodeURIComponent('TRÁI')}`).expect(200);

      expect(titles(response.body)).toEqual(['Trái cây']);
    });

    it('từ chối từ khoá quá dài và sort không cho phép', async () => {
      await get(`/public?q=${'a'.repeat(101)}`).expect(400);
      await get('/public?sort=ownerId').expect(400);
    });
  });

  describe('GET /sets/:id', () => {
    it('khách xem được bộ công khai kèm thẻ theo thứ tự', async () => {
      const { id } = await seedSet('Công khai', {
        visibility: 'PUBLIC',
        cardCount: 2,
        cards: {
          create: [
            { term: 'b', definition: 'hai', position: 1 },
            { term: 'a', definition: 'một', position: 0 },
          ],
        },
      });

      const response = await get(`/${id}`).expect(200);

      expect(response.body.data.owner).toEqual({ displayName: 'owner@example.com' });
      expect(response.body.data.cards.map(({ term }: { term: string }) => term)).toEqual([
        'a',
        'b',
      ]);
    });

    it.each(['PRIVATE', 'CLASS'])('bộ %s chỉ chủ và ADMIN xem được', async (visibility) => {
      const { id } = await seedSet('Riêng', { visibility });

      await get(`/${id}`, owner.token).expect(200);
      await get(`/${id}`, admin.token).expect(200);
      for (const token of [undefined, other.token]) {
        const response = await get(`/${id}`, token).expect(404);
        expect(response.body.error.code).toBe(ERROR_CODES.SET_NOT_FOUND);
      }
    });

    it('trả 404 khi bộ từ đã xoá, kể cả với chủ', async () => {
      const { id } = await seedSet('Đã xoá', { visibility: 'PUBLIC', deletedAt: new Date() });

      await get(`/${id}`, owner.token).expect(404);
      await get('/khong-co').expect(404);
    });

    it('trả 401 khi gửi token sai, để client refresh thay vì xem như khách', async () => {
      const { id } = await seedSet('Công khai', { visibility: 'PUBLIC' });

      await get(`/${id}`, 'token-sai').expect(401);
    });
  });
});
