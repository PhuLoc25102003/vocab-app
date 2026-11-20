import { randomUUID } from 'node:crypto';
import cookie from '@fastify/cookie';
import type { ModuleMetadata } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import type { FastifyServerOptions } from 'fastify';
import { AppModule } from '../../src/app.module';
import { applyBodyLimits } from '../../src/config/body-limit';
import { REDIS_CLIENT, type RedisClient } from '../../src/infrastructure/redis/redis-client';

/**
 * Dựng AppModule thật, kèm guard, filter và database test.
 * Mặc định không có Redis, truyền `redis` để dùng bộ đếm chung.
 * Tin proxy ở loopback để test giả lập nhiều IP bằng `X-Forwarded-For`.
 */
export async function createTestApp(
  extra: Pick<ModuleMetadata, 'controllers'> = {},
  adapterOptions: Pick<FastifyServerOptions, 'loggerInstance'> = {},
  { redis = null }: { redis?: RedisClient | null } = {},
): Promise<NestFastifyApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    ...extra,
  })
    .overrideProvider(REDIS_CLIENT)
    .useValue(redis)
    .compile();

  const adapter = new FastifyAdapter({
    genReqId: () => randomUUID(),
    trustProxy: 'loopback',
    ...adapterOptions,
  });
  applyBodyLimits(adapter);

  const app = moduleRef.createNestApplication<NestFastifyApplication>(adapter, { logger: false });
  app.setGlobalPrefix('api/v1');
  await app.register(cookie);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}
