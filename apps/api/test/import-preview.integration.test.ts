import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES, IMPORT_MAX_CHARS, MAX_CARDS_PER_SET, vm } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

describe('POST /import/preview', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let token: string;

  const preview = (body: object, auth: string | null = token) => {
    const call = request(app.getHttpServer()).post('/api/v1/import/preview').send(body);
    return auth ? call.set('Authorization', `Bearer ${auth}`) : call;
  };

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    const user = await prisma.user.create({
      data: { email: 'student@example.com', displayName: 'Học sinh' },
    });
    token = await app.get(AccessTokenService).sign(user);
  });

  afterAll(async () => {
    await app.close();
  });

  it('cần đăng nhập', async () => {
    const response = await preview({ content: 'apple\tquả táo' }, null);

    expect(response.status).toBe(401);
  });

  it('trả từng dòng kèm lỗi và không lưu gì', async () => {
    const response = await preview({
      content: 'Từ,Nghĩa\napple,quả táo\nchỉ có từ\n',
      options: { delimiter: 'auto', hasHeader: true },
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      delimiter: 'comma',
      columnCount: 2,
      rows: [
        { line: 2, term: 'apple', definition: 'quả táo', errors: [] },
        {
          line: 3,
          term: 'chỉ có từ',
          definition: '',
          errors: [vm('required', { field: 'definition' })],
        },
      ],
    });
    expect(await prisma.card.count()).toBe(0);
  });

  it('đọc cột phiên âm và ví dụ không bắt buộc', async () => {
    const response = await preview({
      content: 'apple\t/ˈæp.əl/\tquả táo\tI eat an apple.\ncat\t\tcon mèo',
      options: { definitionColumn: 3, phoneticColumn: 2, exampleColumn: 4 },
    });

    expect(response.status).toBe(200);
    expect(response.body.data.rows).toEqual([
      {
        line: 1,
        term: 'apple',
        definition: 'quả táo',
        phonetic: '/ˈæp.əl/',
        example: 'I eat an apple.',
        errors: [],
      },
      { line: 2, term: 'cat', definition: 'con mèo', phonetic: '', example: '', errors: [] },
    ]);
  });

  it('từ chối nội dung rỗng, quá 2 MB hoặc cột trùng, kể cả cột phiên âm', async () => {
    const responses = await Promise.all([
      preview({ content: '  \n ' }),
      preview({ content: 'a'.repeat(IMPORT_MAX_CHARS + 1) }),
      preview({ content: 'a\tb', options: { termColumn: 1, definitionColumn: 1 } }),
      preview({ content: 'a\tb', options: { phoneticColumn: 2 } }),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    }
  });

  it(`từ chối quá ${MAX_CARDS_PER_SET} dòng`, async () => {
    const content = Array.from({ length: MAX_CARDS_PER_SET + 1 }, (_, i) => `w${i}\tn${i}`).join(
      '\n',
    );

    const response = await preview({ content });

    expect(response.status).toBe(422);
    expect(response.body.error).toMatchObject({
      code: ERROR_CODES.IMPORT_TOO_MANY_ROWS,
      details: { max: MAX_CARDS_PER_SET, rows: MAX_CARDS_PER_SET + 1 },
    });
  });
});
