import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';
import { OBJECT_STORAGE, R2Storage } from './object-storage';

@Global()
@Module({
  providers: [
    {
      provide: OBJECT_STORAGE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const r2 = {
          accountId: config.get('R2_ACCOUNT_ID', { infer: true }),
          accessKeyId: config.get('R2_ACCESS_KEY_ID', { infer: true }),
          secretAccessKey: config.get('R2_SECRET_ACCESS_KEY', { infer: true }),
          bucket: config.get('R2_BUCKET', { infer: true }),
          publicUrl: config.get('R2_PUBLIC_URL', { infer: true }),
        };
        return Object.values(r2).every(Boolean) ? new R2Storage(r2) : null;
      },
    },
  ],
  exports: [OBJECT_STORAGE],
})
export class StorageModule {}
