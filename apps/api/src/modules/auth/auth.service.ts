import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES, type AuthUser, type LoginInput, type RegisterInput } from '@vocab/shared';
import { AccessTokenService } from '../../common/auth/access-token.service';
import { ok } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import { UsersRepository } from '../users/users.repository';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly passwords: PasswordService,
    private readonly accessTokens: AccessTokenService,
  ) {}

  /** Email đã có hay chưa đều hash và trả cùng kết quả, để không lộ email đã đăng ký. */
  async register({ email, password, displayName }: RegisterInput) {
    const passwordHash = await this.passwords.hash(password);
    await this.users.createIfEmailFree({ email, displayName, passwordHash });
    return ok({ status: 'accepted' as const });
  }

  async login({ email, password }: LoginInput) {
    const account = await this.users.findCredentialsByEmail(email);
    const matches = await this.passwords.verify(account?.passwordHash ?? null, password);
    if (!account || !matches) {
      throw new AppError(
        ERROR_CODES.INVALID_CREDENTIALS,
        'Email hoặc mật khẩu không đúng',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user: AuthUser = {
      id: account.id,
      email: account.email,
      displayName: account.displayName,
      role: account.role,
    };
    return ok({ user, accessToken: await this.accessTokens.sign(account) });
  }
}
