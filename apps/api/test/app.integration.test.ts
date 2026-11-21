import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES, paginationSchema, type Pagination } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ok, paginated } from '../src/common/base/pagination';
import { Public } from '../src/common/decorators/public.decorator';
import { AppError } from '../src/common/errors/app-error';
import { ZodValidationPipe } from '../src/common/pipes/zod-validation.pipe';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { currentDatabaseName, resetDatabase } from './support/database';

/** Controller chỉ dùng trong test, để kiểm tra phần nền khi chưa có endpoint nghiệp vụ. */
@Controller('probe')
class ProbeController {
  @Public()
  @Get('error')
  error(): never {
    throw new AppError(ERROR_CODES.SET_NOT_FOUND, 'Không tìm thấy bộ từ', HttpStatus.NOT_FOUND, {
      id: 'set-1',
    });
  }

  @Public()
  @Get('list')
  list(@Query(new ZodValidationPipe(paginationSchema)) query: Pagination) {
    return paginated(['a', 'b'], 135, query);
  }

  @Get('private')
  privateRoute() {
    return ok('secret');
  }
}

describe('API', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp({ controllers: [ProbeController] });
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('chạy trên database test', async () => {
    await expect(currentDatabaseName(prisma)).resolves.toMatch(/_test$/);
  });

  it('có đủ migration và xoá được dữ liệu giữa các test', async () => {
    await prisma.user.create({ data: { email: 'a@example.com', displayName: 'A' } });
    expect(await prisma.user.count()).toBe(1);

    await resetDatabase(prisma);

    expect(await prisma.user.count()).toBe(0);
  });

  it('GET /health trả trạng thái của API và database', async () => {
    const response = await api().get('/api/v1/health').expect(200);
    expect(response.body).toEqual({ status: 'ok', db: 'up' });
  });

  it('chặn route không có @Public() bằng 401', async () => {
    const response = await api().get('/api/v1/probe/private').expect(401);
    expect(response.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
  });

  it('trả AppError theo định dạng lỗi chung', async () => {
    const response = await api().get('/api/v1/probe/error').expect(404);

    expect(response.body).toEqual({
      error: {
        code: ERROR_CODES.SET_NOT_FOUND,
        message: 'Không tìm thấy bộ từ',
        details: { id: 'set-1' },
        requestId: response.headers['x-request-id'],
      },
    });
    expect(response.headers['x-request-id']).toBeTruthy();
  });

  it('trả danh sách có meta phân trang', async () => {
    const response = await api().get('/api/v1/probe/list?page=2&limit=10').expect(200);
    expect(response.body).toEqual({
      data: ['a', 'b'],
      meta: { page: 2, limit: 10, total: 135 },
    });
  });

  it('trả 400 khi tham số phân trang sai', async () => {
    const response = await api().get('/api/v1/probe/list?limit=101').expect(400);

    expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(response.body.error.details[0].path).toBe('limit');
  });

  it('trả NOT_FOUND cho đường dẫn không tồn tại', async () => {
    const response = await api().get('/api/v1/khong-ton-tai').expect(404);
    expect(response.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
  });
});
