import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES, type Role } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

describe('bộ từ trong thư mục', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let owner: { id: string; token: string };
  let other: { id: string; token: string };
  let admin: { id: string; token: string };
  let setId: string;
  let folderId: string;
  let otherFolderId: string;

  const createUser = async (email: string, role: Role = 'STUDENT') => {
    const user = await prisma.user.create({ data: { email, displayName: email, role } });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };
  const patch = (body: object, token = owner.token) =>
    request(app.getHttpServer())
      .patch(`/api/v1/sets/${setId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  const listMine = (query: string, token = owner.token) =>
    request(app.getHttpServer())
      .get(`/api/v1/sets?${query}`)
      .set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    owner = await createUser('owner@example.com');
    other = await createUser('other@example.com');
    admin = await createUser('admin@example.com', 'ADMIN');
    folderId = (await prisma.folder.create({ data: { ownerId: owner.id, name: 'Lớp 10' } })).id;
    otherFolderId = (await prisma.folder.create({ data: { ownerId: other.id, name: 'X' } })).id;
    setId = (
      await prisma.studySet.create({
        data: { ownerId: owner.id, title: 'Trái cây', visibility: 'PUBLIC' },
      })
    ).id;
    await prisma.studySet.create({ data: { ownerId: owner.id, title: 'Ngoài thư mục' } });
  });

  afterAll(async () => {
    await app.close();
  });

  it('chủ chuyển bộ vào thư mục rồi lọc được theo thư mục và theo "none"', async () => {
    const moved = await patch({ folderId }).expect(200);

    const inFolder = await listMine(`folderId=${folderId}`).expect(200);
    const outside = await listMine('folderId=none').expect(200);

    expect(moved.body.data.folderId).toBe(folderId);
    expect(inFolder.body.data.map((set: { title: string }) => set.title)).toEqual(['Trái cây']);
    expect(outside.body.data.map((set: { title: string }) => set.title)).toEqual(['Ngoài thư mục']);
  });

  it('đưa bộ ra khỏi thư mục bằng null', async () => {
    await patch({ folderId }).expect(200);

    const { body } = await patch({ folderId: null }).expect(200);

    expect(body.data.folderId).toBeNull();
  });

  it('không dùng được thư mục của người khác, kể cả ADMIN sửa thay', async () => {
    const foreign = await patch({ folderId: otherFolderId }).expect(404);
    const byAdmin = await patch({ folderId: otherFolderId }, admin.token).expect(404);
    const missing = await patch({ folderId: 'khong-co' }).expect(404);
    await patch({ folderId }, admin.token).expect(200);

    for (const response of [foreign, byAdmin, missing]) {
      expect(response.body.error.code).toBe(ERROR_CODES.FOLDER_NOT_FOUND);
    }
  });

  it('người khác không thấy thư mục của chủ ở trang công khai', async () => {
    await patch({ folderId }).expect(200);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/sets/${setId}`)
      .set('Authorization', `Bearer ${other.token}`)
      .expect(200);
    const publicList = await request(app.getHttpServer()).get('/api/v1/sets/public').expect(200);
    const ownDetail = await request(app.getHttpServer())
      .get(`/api/v1/sets/${setId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);

    expect(detail.body.data).not.toHaveProperty('folderId');
    expect(publicList.body.data[0]).not.toHaveProperty('folderId');
    expect(ownDetail.body.data.folderId).toBe(folderId);
  });
});
