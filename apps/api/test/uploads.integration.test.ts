import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { R2Storage } from '../src/infrastructure/storage/object-storage';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

// ConfigModule đọc env khi nạp AppModule, nên phải đặt trước mọi import.
const { PUBLIC_URL } = vi.hoisted(() => {
  process.env.R2_PUBLIC_URL = 'https://pub.r2.dev';
  return { PUBLIC_URL: 'https://pub.r2.dev' };
});

const storage = new R2Storage({
  accountId: 'acc',
  accessKeyId: 'key',
  secretAccessKey: 'secret',
  bucket: 'vocab-media',
  publicUrl: PUBLIC_URL,
});

describe('tải ảnh của thẻ', () => {
  let app: NestFastifyApplication;
  let disabled: NestFastifyApplication;
  let prisma: PrismaService;
  let token: string;

  const call = (target: NestFastifyApplication) => {
    const server = request(target.getHttpServer());
    return {
      get: (path: string) => server.get(`/api/v1${path}`).set('Authorization', `Bearer ${token}`),
      post: (path: string) => server.post(`/api/v1${path}`).set('Authorization', `Bearer ${token}`),
      put: (path: string) => server.put(`/api/v1${path}`).set('Authorization', `Bearer ${token}`),
    };
  };

  beforeAll(async () => {
    [app, disabled] = await Promise.all([createTestApp({}, {}, { storage }), createTestApp()]);
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    const user = await prisma.user.create({ data: { email: 'an@example.com', displayName: 'An' } });
    token = await app.get(AccessTokenService).sign(user);
  });

  afterAll(async () => {
    await Promise.all([app.close(), disabled.close()]);
    delete process.env.R2_PUBLIC_URL;
  });

  it('báo đã bật tải ảnh và cấp URL ký sẵn trong thư mục của người dùng', async () => {
    const config = await call(app).get('/uploads/config').expect(200);
    expect(config.body.data).toEqual({
      images: true,
      imageSearch: false,
      maxBytes: 1024 * 1024,
      contentTypes: ['image/png', 'image/jpeg', 'image/webp'],
    });

    const { body } = await call(app)
      .post('/uploads/presign')
      .send({ contentType: 'image/webp', size: 5000 })
      .expect(200);

    const user = await prisma.user.findFirstOrThrow();
    expect(body.data.publicUrl).toMatch(
      new RegExp(`^${PUBLIC_URL}/cards/${user.id}/[0-9a-f-]{36}\\.webp$`),
    );
    expect(new URL(body.data.uploadUrl).searchParams.get('X-Amz-Expires')).toBe('300');
    expect(body.data.headers).toEqual({ 'content-type': 'image/webp' });
  });

  it('từ chối loại ảnh lạ, ảnh quá 1 MB và người chưa đăng nhập', async () => {
    await call(app)
      .post('/uploads/presign')
      .send({ contentType: 'image/svg+xml', size: 100 })
      .expect(400);
    await call(app)
      .post('/uploads/presign')
      .send({ contentType: 'image/png', size: 1024 * 1024 + 1 })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/uploads/presign')
      .send({ contentType: 'image/png', size: 100 })
      .expect(401);
  });

  it('thiếu khoá R2 thì báo chưa bật và trả 503', async () => {
    expect((await call(disabled).get('/uploads/config').expect(200)).body.data.images).toBe(false);

    const { body } = await call(disabled)
      .post('/uploads/presign')
      .send({ contentType: 'image/png', size: 100 })
      .expect(503);
    expect(body.error.code).toBe(ERROR_CODES.UPLOADS_DISABLED);
  });

  it('thẻ chỉ nhận ảnh trong kho của app', async () => {
    const own = `${PUBLIC_URL}/cards/u1/anh.png`;
    const created = await call(app)
      .post('/sets')
      .send({ title: 'Trái cây', cards: [{ term: 'apple', definition: 'quả táo', imageUrl: own }] })
      .expect(201);
    const setId = created.body.data.id as string;
    const detail = await call(app).get(`/sets/${setId}`).expect(200);
    expect(detail.body.data.cards[0].imageUrl).toBe(own);
    const cardId = detail.body.data.cards[0].id as string;

    const foreign = await call(app)
      .put(`/sets/${setId}/cards`)
      .send({
        cards: [
          {
            id: cardId,
            term: 'apple',
            definition: 'quả táo',
            imageUrl: 'https://evil.example/a.png',
          },
        ],
      })
      .expect(400);
    expect(foreign.body.error.code).toBe(ERROR_CODES.CARD_IMAGE_INVALID);
    expect(foreign.body.error.details[0].path).toBe('cards.0.imageUrl');

    // Client không gửi `imageUrl` thì giữ ảnh cũ.
    await call(app)
      .put(`/sets/${setId}/cards`)
      .send({ cards: [{ id: cardId, term: 'apple', definition: 'quả táo đỏ' }] })
      .expect(200);
    expect((await prisma.card.findUniqueOrThrow({ where: { id: cardId } })).imageUrl).toBe(own);

    // Gỡ ảnh, rồi gắn lại ảnh mới khi lưu toàn bộ thẻ.
    await call(app)
      .put(`/sets/${setId}/cards`)
      .send({ cards: [{ id: cardId, term: 'apple', definition: 'quả táo', imageUrl: null }] })
      .expect(200);
    expect((await prisma.card.findUniqueOrThrow({ where: { id: cardId } })).imageUrl).toBeNull();
    const replaced = `${PUBLIC_URL}/cards/u1/moi.webp`;
    await call(app)
      .put(`/sets/${setId}/cards`)
      .send({ cards: [{ id: cardId, term: 'apple', definition: 'quả táo', imageUrl: replaced }] })
      .expect(200);
    expect((await prisma.card.findUniqueOrThrow({ where: { id: cardId } })).imageUrl).toBe(
      replaced,
    );

    // Chấp nhận ảnh từ Unsplash và Pixabay
    const unsplashUrl = 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800';
    await call(app)
      .put(`/sets/${setId}/cards`)
      .send({
        cards: [{ id: cardId, term: 'apple', definition: 'quả táo', imageUrl: unsplashUrl }],
      })
      .expect(200);
    expect((await prisma.card.findUniqueOrThrow({ where: { id: cardId } })).imageUrl).toBe(
      unsplashUrl,
    );
  });

  it('GET /uploads/search-images trả mảng rỗng khi query trống hoặc chưa có key', async () => {
    const res = await call(app).get('/uploads/search-images?query=').expect(200);
    expect(res.body.data).toEqual([]);
  });
});
