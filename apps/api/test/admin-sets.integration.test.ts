import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

describe('ẩn bộ từ vi phạm', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let admin: { id: string; token: string };
  let owner: { id: string; token: string };
  let other: { id: string; token: string };
  let setId: string;

  const server = () => request(app.getHttpServer());
  const createUser = async (email: string, role: 'STUDENT' | 'ADMIN' = 'STUDENT') => {
    const user = await prisma.user.create({ data: { email, displayName: email, role } });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };
  const patch = (token: string | null, path: string, body: object = {}) => {
    const call = server().patch(`/api/v1/admin/sets/${path}`).send(body);
    return token ? call.set('Authorization', `Bearer ${token}`) : call;
  };
  const getSet = (token: string | null) => {
    const call = server().get(`/api/v1/sets/${setId}`);
    return token ? call.set('Authorization', `Bearer ${token}`) : call;
  };
  const publicIds = async () => {
    const { body } = await server().get('/api/v1/sets/public').expect(200);
    return (body.data as { id: string }[]).map(({ id }) => id);
  };

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    admin = await createUser('admin@example.com', 'ADMIN');
    owner = await createUser('owner@example.com');
    other = await createUser('other@example.com');
    const set = await prisma.studySet.create({
      data: {
        ownerId: owner.id,
        title: 'Bộ vi phạm',
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

  it('chỉ ADMIN gọi được và lý do là bắt buộc', async () => {
    await patch(null, `${setId}/hide`, { reason: 'Spam' }).expect(401);
    await patch(owner.token, `${setId}/hide`, { reason: 'Spam' }).expect(403);
    await patch(admin.token, `${setId}/hide`, { reason: ' ' }).expect(400);
    const missing = await patch(admin.token, 'khong-co/hide', { reason: 'Spam' }).expect(404);
    expect(missing.body.error.code).toBe(ERROR_CODES.SET_NOT_FOUND);
  });

  it('bộ bị ẩn biến mất với khách và người khác, chủ và ADMIN vẫn thấy, bỏ ẩn thì hiện lại', async () => {
    expect(await publicIds()).toEqual([setId]);

    const { body } = await patch(admin.token, `${setId}/hide`, { reason: 'Nội dung xấu' }).expect(
      200,
    );
    expect(body.data).toMatchObject({
      id: setId,
      hiddenReason: 'Nội dung xấu',
      hiddenById: admin.id,
      hiddenAt: expect.any(String),
    });

    expect(await publicIds()).toEqual([]);
    await getSet(null).expect(404);
    await getSet(other.token).expect(404);
    await server()
      .post('/api/v1/study/sessions')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ setId, mode: 'FLASHCARD' })
      .expect(404);
    const ownerView = await getSet(owner.token).expect(200);
    expect(ownerView.body.data).toMatchObject({ hiddenReason: 'Nội dung xấu' });
    await getSet(admin.token).expect(200);

    const unhidden = await patch(admin.token, `${setId}/unhide`).expect(200);
    expect(unhidden.body.data).toMatchObject({ hiddenAt: null, hiddenReason: null });
    expect(await publicIds()).toEqual([setId]);
    await getSet(null).expect(200);
  });

  it('GET /admin/stats đếm người dùng, tài khoản khoá, bộ từ, bộ bị ẩn cho ADMIN', async () => {
    const stats = (token: string | null) => {
      const call = server().get('/api/v1/admin/stats');
      return token ? call.set('Authorization', `Bearer ${token}`) : call;
    };
    await stats(null).expect(401);
    await stats(owner.token).expect(403);

    await prisma.user.update({ where: { id: other.id }, data: { lockedAt: new Date() } });
    await patch(admin.token, `${setId}/hide`, { reason: 'Spam' }).expect(200);
    await prisma.studySet.create({
      data: { ownerId: owner.id, title: 'Đã xoá', deletedAt: new Date() },
    });

    const { body } = await stats(admin.token).expect(200);
    expect(body.data).toMatchObject({ users: 3, lockedUsers: 1, sets: 1, hiddenSets: 1 });
    // Việc 5.21: số liệu tăng trưởng, vai trò, chuỗi 30 ngày, hàng chờ rà.
    expect(body.data).toMatchObject({ newUsers: 3, activeUsers: 0, sessions: 0 });
    expect(body.data.roles.ADMIN).toBe(1);
    expect(body.data.daily).toHaveLength(30);
    expect(body.data.daily.at(-1).signups).toBe(3);
    expect(body.data.recentUsers).toHaveLength(3);
  });

  it('GET /admin/sets/hidden trả danh sách bộ từ bị ẩn phân trang và tìm kiếm cho ADMIN', async () => {
    const getHidden = (token: string | null, query = '') => {
      const call = server().get(`/api/v1/admin/sets/hidden${query}`);
      return token ? call.set('Authorization', `Bearer ${token}`) : call;
    };

    await getHidden(null).expect(401);
    await getHidden(owner.token).expect(403);

    // Chưa ẩn bộ nào
    const emptyRes = await getHidden(admin.token).expect(200);
    expect(emptyRes.body.data).toEqual([]);
    expect(emptyRes.body.meta.total).toBe(0);

    // Ẩn bộ setId
    await patch(admin.token, `${setId}/hide`, { reason: 'Nội dung phản cảm' }).expect(200);

    const hiddenRes = await getHidden(admin.token).expect(200);
    expect(hiddenRes.body.data).toHaveLength(1);
    expect(hiddenRes.body.data[0]).toMatchObject({
      id: setId,
      title: 'Bộ vi phạm',
      hiddenReason: 'Nội dung phản cảm',
      owner: { id: owner.id, email: 'owner@example.com' },
      hiddenBy: { id: admin.id, displayName: 'admin@example.com' },
    });
    expect(hiddenRes.body.meta.total).toBe(1);

    // Tìm kiếm khớp và không khớp
    const match = await getHidden(admin.token, '?q=vi phạm').expect(200);
    expect(match.body.data).toHaveLength(1);

    const noMatch = await getHidden(admin.token, '?q=không khớp').expect(200);
    expect(noMatch.body.data).toHaveLength(0);
  });
});
