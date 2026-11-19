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
    await getSet(owner.token).expect(200);
    await getSet(admin.token).expect(200);

    const unhidden = await patch(admin.token, `${setId}/unhide`).expect(200);
    expect(unhidden.body.data).toMatchObject({ hiddenAt: null, hiddenReason: null });
    expect(await publicIds()).toEqual([setId]);
    await getSet(null).expect(200);
  });
});
