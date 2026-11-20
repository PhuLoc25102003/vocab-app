import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { REDIS_CLIENT, type RedisClient } from '../../infrastructure/redis/redis-client';
import { SharedThrottlerStorage } from '../../infrastructure/redis/shared-throttler.storage';
import { UsersDataModule } from '../users/users-data.module';
import { AUTH_THROTTLE_OPTIONS } from './auth-throttler.guard';
import { AuthSessionService } from './auth-session.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleIdentityService } from './google-identity.service';
import { PasswordResetRepository } from './password-reset.repository';
import { PasswordResetService } from './password-reset.service';
import { PasswordService } from './password.service';
import { RefreshCookie } from './refresh-cookie';
import { RefreshSessionRepository } from './refresh-session.repository';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [REDIS_CLIENT],
      useFactory: (redis: RedisClient | null) => ({
        ...AUTH_THROTTLE_OPTIONS,
        storage: new SharedThrottlerStorage(redis),
      }),
    }),
    UsersDataModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthSessionService,
    GoogleIdentityService,
    PasswordResetRepository,
    PasswordResetService,
    PasswordService,
    RefreshCookie,
    RefreshSessionRepository,
  ],
  exports: [AuthSessionService, PasswordService, RefreshCookie],
})
export class AuthModule {}
