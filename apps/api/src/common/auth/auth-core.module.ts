import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenService } from './access-token.service';
import { OwnershipRepository } from './ownership.repository';
import { TokenUserRepository } from './token-user.repository';

/** Phần xác thực mà `AuthGuard` toàn cục cần. Secret được truyền theo từng lần ký. */
@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [AccessTokenService, OwnershipRepository, TokenUserRepository],
  exports: [JwtModule, AccessTokenService, OwnershipRepository, TokenUserRepository],
})
export class AuthCoreModule {}
