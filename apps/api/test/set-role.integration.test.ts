import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { parseSetRoleArgs, runSetRole } from '../src/cli/set-role';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { UsersRepository } from '../src/modules/users/users.repository';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

describe('lệnh gán vai trò', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let users: UsersRepository;
  const setRole = (argv: string[]) =>
    runSetRole(argv, (email, role) => users.setRoleByEmail(email, role));

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    users = app.get(UsersRepository);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    await prisma.user.create({ data: { email: 'loc@example.com', displayName: 'Lộc' } });
  });

  afterAll(async () => {
    await app.close();
  });

  it('đọc email không phân biệt hoa thường và vai trò viết thường', () => {
    expect(parseSetRoleArgs([' Loc@Example.com ', 'admin'])).toEqual({
      ok: true,
      email: 'loc@example.com',
      role: 'ADMIN',
    });
  });

  it('báo cách dùng khi thiếu hoặc thừa tham số, báo lỗi email và vai trò sai', () => {
    expect(parseSetRoleArgs(['loc@example.com'])).toMatchObject({ ok: false });
    expect(parseSetRoleArgs(['a', 'ADMIN', 'thừa'])).toMatchObject({ ok: false });
    expect(parseSetRoleArgs(['khong-phai-email', 'ADMIN'])).toEqual({
      ok: false,
      message: 'Email không hợp lệ: khong-phai-email',
    });
    expect(parseSetRoleArgs(['loc@example.com', 'OWNER'])).toMatchObject({
      ok: false,
      message: expect.stringContaining('STUDENT, TEACHER hoặc ADMIN'),
    });
  });

  it('đổi vai trò của tài khoản có sẵn', async () => {
    const result = await setRole(['LOC@example.com', 'TEACHER']);

    expect(result).toEqual({
      code: 0,
      message: 'Đã đặt loc@example.com (Lộc) thành TEACHER. Tải lại trang web để thấy quyền mới.',
    });
    expect(await prisma.user.findUnique({ where: { email: 'loc@example.com' } })).toMatchObject({
      role: 'TEACHER',
    });
  });

  it('không có tài khoản, đã xoá hoặc tham số sai thì trả mã lỗi và không đổi gì', async () => {
    expect(await setRole(['ai@example.com', 'ADMIN'])).toMatchObject({ code: 1 });
    await prisma.user.update({
      where: { email: 'loc@example.com' },
      data: { deletedAt: new Date() },
    });
    expect(await setRole(['loc@example.com', 'ADMIN'])).toMatchObject({ code: 1 });
    expect(await setRole(['loc@example.com'])).toMatchObject({ code: 1 });
    expect(await prisma.user.findUnique({ where: { email: 'loc@example.com' } })).toMatchObject({
      role: 'STUDENT',
    });
  });
});
