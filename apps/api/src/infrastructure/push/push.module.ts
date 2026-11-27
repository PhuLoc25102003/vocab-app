import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';
import { InMemoryPushSender, PushSender, WebPushSender } from './push-sender';

@Global()
@Module({
  providers: [
    {
      provide: PushSender,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const publicKey = config.get('VAPID_PUBLIC_KEY', { infer: true });
        const privateKey = config.get('VAPID_PRIVATE_KEY', { infer: true });
        const subject = config.get('VAPID_SUBJECT', { infer: true });
        return publicKey && privateKey && subject
          ? new WebPushSender(publicKey, privateKey, subject)
          : new InMemoryPushSender();
      },
    },
  ],
  exports: [PushSender],
})
export class PushModule {}
