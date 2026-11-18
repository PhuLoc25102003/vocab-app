import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from '../users/users.module';
import { AUTH_THROTTLE_OPTIONS } from './auth-throttler.guard';
import { AuthSessionService } from './auth-session.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { RefreshCookie } from './refresh-cookie';
import { RefreshSessionRepository } from './refresh-session.repository';

@Module({
  imports: [ThrottlerModule.forRoot(AUTH_THROTTLE_OPTIONS), UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthSessionService,
    PasswordService,
    RefreshCookie,
    RefreshSessionRepository,
  ],
})
export class AuthModule {}
