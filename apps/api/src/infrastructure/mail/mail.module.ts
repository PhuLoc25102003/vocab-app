import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';
import { BrevoMailer, InMemoryMailer, Mailer } from './mailer';

@Global()
@Module({
  providers: [
    {
      provide: Mailer,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const apiKey = config.get('BREVO_API_KEY', { infer: true });
        const from = config.get('EMAIL_FROM', { infer: true });
        return apiKey && from ? new BrevoMailer(apiKey, from) : new InMemoryMailer();
      },
    },
  ],
  exports: [Mailer],
})
export class MailModule {}
