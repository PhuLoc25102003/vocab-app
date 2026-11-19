import { Writable } from 'node:stream';
import { Controller, Logger, Post, Req } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { FastifyRequest } from 'fastify';
import pino from 'pino';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Public } from '../src/common/decorators/public.decorator';
import { SkipApiRateLimit } from '../src/common/decorators/skip-api-rate-limit.decorator';
import { buildLoggerOptions, PinoLoggerService, REDACTED } from '../src/config/logger';
import { createTestApp } from './support/app';

const SECRETS = {
  password: 'mat-khau-bi-mat-123',
  token: 'token-bi-mat-456',
  cookie: 'refresh_token=cookie-bi-mat-789',
  query: 'query-bi-mat-000',
};

@Controller('log-probe')
class LogProbeController {
  private readonly logger = new Logger('LogProbe');

  @Public()
  @SkipApiRateLimit()
  @Post()
  fail(@Req() request: FastifyRequest): never {
    // Mô phỏng code vô tình ghi cả body và header ra log.
    request.log.info({ body: request.body, headers: request.headers }, 'nhận yêu cầu');
    this.logger.warn({ password: SECRETS.password }, 'cảnh báo từ Nest');
    throw new Error('Hỏng bất ngờ');
  }
}

describe('Log của API', () => {
  let app: NestFastifyApplication;
  const lines: string[] = [];

  beforeAll(async () => {
    const stream = new Writable({
      write(chunk: Buffer, _encoding, done) {
        lines.push(...chunk.toString().split('\n').filter(Boolean));
        done();
      },
    });
    const loggerInstance = pino(buildLoggerOptions({ LOG_LEVEL: 'info' }), stream);
    app = await createTestApp({ controllers: [LogProbeController] }, { loggerInstance });
    app.useLogger(new PinoLoggerService(loggerInstance));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    lines.length = 0;
  });

  it('ghi JSON có requestId và ẩn giá trị nhạy cảm', async () => {
    const response = await app
      .getHttpAdapter()
      .getInstance()
      .inject({
        method: 'POST',
        url: `/api/v1/log-probe?token=${SECRETS.query}`,
        headers: { authorization: `Bearer ${SECRETS.token}`, cookie: SECRETS.cookie },
        payload: {
          email: 'a@example.com',
          password: SECRETS.password,
          refreshToken: SECRETS.token,
        },
      });
    const requestId = response.json<{ error: { requestId: string } }>().error.requestId;
    const output = lines.join('\n');
    const entries = lines.map((line) => JSON.parse(line) as Record<string, unknown>);

    expect(response.statusCode).toBe(500);
    for (const secret of Object.values(SECRETS)) {
      expect(output).not.toContain(secret);
    }
    expect(output).toContain(REDACTED);
    expect(entries.find((entry) => entry.msg === 'Lỗi không xử lý được')).toMatchObject({
      reqId: requestId,
      err: { message: 'Hỏng bất ngờ' },
    });
    expect(entries.find((entry) => entry.msg === 'nhận yêu cầu')).toMatchObject({
      reqId: requestId,
      body: { email: 'a@example.com', password: REDACTED },
    });
  });
});
