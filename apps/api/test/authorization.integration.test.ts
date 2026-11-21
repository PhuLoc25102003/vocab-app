import { Controller, Get, Param } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES, type Role } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { ok } from '../src/common/base/pagination';
import { CheckOwnership } from '../src/common/decorators/check-ownership.decorator';
import { Public } from '../src/common/decorators/public.decorator';
import { Roles } from '../src/common/decorators/roles.decorator';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

@Controller('probe-authz')
class ProbeAuthzController {
  @Get('open')
  open() {
    return ok('open');
  }

  @Public()
  @Roles('ADMIN')
  @Get('public-admin')
  publicAdmin() {
    return ok('admin');
  }

  @Roles('TEACHER', 'ADMIN')
  @Get('staff')
  staff() {
    return ok('staff');
  }

  @CheckOwnership('set')
  @Get('sets/:id')
  set(@Param('id') id: string) {
    return ok(id);
  }

  @CheckOwnership('set', 'setId')
  @Get('nested/:setId/cards')
  nested(@Param('setId') id: string) {
    return ok(id);
  }

  @Public()
  @CheckOwnership('set')
  @Get('public-sets/:id')
  publicSet(@Param('id') id: string) {
    return ok(id);
  }

  @CheckOwnership('session')
  @Get('sessions/:id')
  session(@Param('id') id: string) {
    return ok(id);
  }
}

describe('phân quyền', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let tokens: Record<'owner' | 'other' | 'teacher' | 'admin', string>;
  let ownerId: string;
  let setId: string;

  const createToken = async (email: string, role: Role) => {
    const user = await prisma.user.create({ data: { email, displayName: email, role } });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };
  const get = (path: string, token?: string) => {
    const call = request(app.getHttpServer()).get(`/api/v1/probe-authz/${path}`);
    return token ? call.set('Authorization', `Bearer ${token}`) : call;
  };
  const expectError = async (path: string, token: string, status: number, code: string) => {
    const response = await get(path, token).expect(status);
    expect(response.body.error.code).toBe(code);
  };

  beforeAll(async () => {
    app = await createTestApp({ controllers: [ProbeAuthzController] });
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    const owner = await createToken('owner@example.com', 'STUDENT');
    ownerId = owner.id;
    tokens = {
      owner: owner.token,
      other: (await createToken('other@example.com', 'STUDENT')).token,
      teacher: (await createToken('teacher@example.com', 'TEACHER')).token,
      admin: (await createToken('admin@example.com', 'ADMIN')).token,
    };
    setId = (await prisma.studySet.create({ data: { ownerId, title: 'Bộ từ' } })).id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('@Roles', () => {
    it('cho vai trò được liệt kê đi tiếp', async () => {
      await get('staff', tokens.teacher).expect(200);
      await get('staff', tokens.admin).expect(200);
    });

    it('trả 403 với vai trò khác', async () => {
      await expectError('staff', tokens.owner, 403, ERROR_CODES.FORBIDDEN);
    });

    it('trả 401 khi chưa đăng nhập', async () => {
      await get('staff').expect(401);
    });

    it('không ảnh hưởng route không khai báo vai trò', async () => {
      await get('open', tokens.owner).expect(200);
    });

    it('từ chối khi route công khai lại yêu cầu vai trò', async () => {
      await get('public-admin').expect(401);
    });
  });

  describe('@CheckOwnership', () => {
    it('cho chủ bộ từ đi tiếp', async () => {
      await get(`sets/${setId}`, tokens.owner).expect(200);
      await get(`nested/${setId}/cards`, tokens.owner).expect(200);
    });

    it('trả 403 với người không sở hữu, kể cả giáo viên', async () => {
      await expectError(`sets/${setId}`, tokens.other, 403, ERROR_CODES.FORBIDDEN);
      await expectError(`sets/${setId}`, tokens.teacher, 403, ERROR_CODES.FORBIDDEN);
      await expectError(`nested/${setId}/cards`, tokens.other, 403, ERROR_CODES.FORBIDDEN);
    });

    it('cho ADMIN bỏ qua kiểm tra sở hữu bộ từ', async () => {
      await get(`sets/${setId}`, tokens.admin).expect(200);
    });

    it('trả 404 khi bộ từ không tồn tại hoặc đã xoá mềm', async () => {
      await expectError('sets/khong-co', tokens.owner, 404, ERROR_CODES.SET_NOT_FOUND);

      await prisma.studySet.update({ where: { id: setId }, data: { deletedAt: new Date() } });
      await expectError(`sets/${setId}`, tokens.owner, 404, ERROR_CODES.SET_NOT_FOUND);
    });

    it('trả 401 khi chưa đăng nhập, kể cả trên route công khai', async () => {
      await get(`sets/${setId}`).expect(401);
      await get(`public-sets/${setId}`).expect(401);
    });

    it('chỉ chủ phiên học đi tiếp, ADMIN không được bỏ qua', async () => {
      const { id } = await prisma.studySession.create({
        data: { userId: ownerId, setId, mode: 'FLASHCARD' },
      });

      await get(`sessions/${id}`, tokens.owner).expect(200);
      await expectError(`sessions/${id}`, tokens.other, 403, ERROR_CODES.FORBIDDEN);
      await expectError(`sessions/${id}`, tokens.admin, 403, ERROR_CODES.FORBIDDEN);
      await expectError('sessions/khong-co', tokens.owner, 404, ERROR_CODES.NOT_FOUND);
    });
  });
});
