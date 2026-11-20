import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';
import { REDIS_CLIENT, UpstashRedisClient } from './redis-client';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const url = config.get('UPSTASH_REDIS_REST_URL', { infer: true });
        const token = config.get('UPSTASH_REDIS_REST_TOKEN', { infer: true });
        return url && token ? new UpstashRedisClient(url, token) : null;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
