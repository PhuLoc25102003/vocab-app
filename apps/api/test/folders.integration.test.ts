import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES, type Role } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

describe('folders', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let owner: { id: string; token: string };
  let other: { id: string; token: string };
  let admin: { id: string; token: string };

  const createUser = async (email: string, role: Role = 'STUDENT') => {
    const user = await prisma.user.create({ data: { email, displayName: email, role } });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };
  const call = (method: 'get' | 'post' | 'patch' | 'delete', url: string, token: string) =>
    request(app.getHttpServer())[method](`/api/v1${url}`).set('Authorization', `Bearer ${token}`);
  const createFolder = async (name: string, token = owner.token) =>
    (await call('post', '/folders', token).send({ name }).expect(201)).body.data as {
      id: string;
      name: string;
      setCount: number;
    };

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
    await request(app.getHttpServer()).get('/api/v1/folders').expect(401);
  });

  it('tạo rồi liệt kê thư mục của mình theo tên, kèm số bộ chưa xoá', async () => {
    const school = await createFolder('  Trường học ');
    await createFolder('Du lịch');
    await createFolder('Của người khác', other.token);
    await prisma.studySet.createMany({
      data: [
        { ownerId: owner.id, title: 'A', folderId: school.id },
        { ownerId: owner.id, title: 'B', folderId: school.id, deletedAt: new Date() },
      ],
    });

    const { body } = await call('get', '/folders', owner.token).expect(200);

    expect(school).toEqual({ id: school.id, name: 'Trường học', setCount: 0 });
    expect(body.data).toEqual([
      expect.objectContaining({ name: 'Du lịch', setCount: 0 }),
      expect.objectContaining({ name: 'Trường học', setCount: 1 }),
    ]);
    expect(body.meta).toMatchObject({ page: 1, total: 2 });
  });

  it('tên trùng không phân biệt hoa thường trả 409, người khác vẫn dùng được tên đó', async () => {
    const first = await createFolder('Ôn thi');

    const duplicate = await call('post', '/folders', owner.token).send({ name: 'ôn THI' });
    const renamed = await call(
      'patch',
      '/folders/' + (await createFolder('Khác')).id,
      owner.token,
    ).send({ name: 'Ôn thi' });
    await createFolder('Ôn thi', other.token);
    const sameName = await call('patch', `/folders/${first.id}`, owner.token).send({
      name: 'ÔN THI',
    });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe(ERROR_CODES.FOLDER_NAME_TAKEN);
    expect(renamed.status).toBe(409);
    expect(sameName.status).toBe(200);
    expect(sameName.body.data.name).toBe('ÔN THI');
  });

  it('từ chối tên rỗng hoặc quá dài', async () => {
    await call('post', '/folders', owner.token).send({ name: '  ' }).expect(400);
    await call('post', '/folders', owner.token)
      .send({ name: 'a'.repeat(61) })
      .expect(400);
  });

  it('người khác, kể cả ADMIN, không sửa hay xoá được thư mục', async () => {
    const folder = await createFolder('Riêng');

    await call('patch', `/folders/${folder.id}`, other.token).send({ name: 'X' }).expect(403);
    await call('delete', `/folders/${folder.id}`, admin.token).expect(403);
    const missing = await call('delete', '/folders/khong-co', owner.token).expect(404);

    expect(missing.body.error.code).toBe(ERROR_CODES.FOLDER_NOT_FOUND);
  });

  it('xoá thư mục không xoá bộ từ bên trong', async () => {
    const folder = await createFolder('Tạm');
    const set = await prisma.studySet.create({
      data: { ownerId: owner.id, title: 'Giữ lại', folderId: folder.id },
    });

    await call('delete', `/folders/${folder.id}`, owner.token).expect(204);

    const kept = await prisma.studySet.findUniqueOrThrow({ where: { id: set.id } });
    expect(kept).toMatchObject({ deletedAt: null, folderId: null });
  });
});
