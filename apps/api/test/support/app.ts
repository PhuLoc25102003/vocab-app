import { randomUUID } from 'node:crypto';
import cookie from '@fastify/cookie';
import type { ModuleMetadata } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import type { FastifyServerOptions } from 'fastify';
import { AppModule } from '../../src/app.module';
import { applyBodyLimits } from '../../src/config/body-limit';
import { InMemoryPushSender, PushSender } from '../../src/infrastructure/push/push-sender';
import { REDIS_CLIENT, type RedisClient } from '../../src/infrastructure/redis/redis-client';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../src/infrastructure/storage/object-storage';

/**
 * Dựng AppModule thật, kèm guard, filter và database test.
 * Mặc định không có Redis, kho tệp và Web Push; truyền `redis`, `storage`, `push` để bật.
 * Tin proxy ở loopback để test giả lập nhiều IP bằng `X-Forwarded-For`.
 */
export async function createTestApp(
  extra: Pick<ModuleMetadata, 'controllers'> = {},
  adapterOptions: Pick<FastifyServerOptions, 'loggerInstance'> = {},
  {
    redis = null,
    storage = null,
    push = new InMemoryPushSender(),
  }: { redis?: RedisClient | null; storage?: ObjectStorage | null; push?: PushSender } = {},
): Promise<NestFastifyApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    ...extra,
  })
    .overrideProvider(REDIS_CLIENT)
    .useValue(redis)
    .overrideProvider(OBJECT_STORAGE)
    .useValue(storage)
    .overrideProvider(PushSender)
    .useValue(push)
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
