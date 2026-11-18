import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES, type AuthUser, type LoginInput, type RegisterInput } from '@vocab/shared';
import { ok } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import { UsersRepository } from '../users/users.repository';
import { AuthSessionService, type IssuedSession, type SessionClient } from './auth-session.service';
import { PasswordService } from './password.service';

function toSessionResult(user: AuthUser, session: IssuedSession) {
  return {
    body: ok({ user, accessToken: session.accessToken }),
    refreshToken: session.refreshToken,
    refreshExpiresAt: session.refreshExpiresAt,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly passwords: PasswordService,
    private readonly sessions: AuthSessionService,
  ) {}

  /** Email đã có hay chưa đều hash và trả cùng kết quả, để không lộ email đã đăng ký. */
  async register({ email, password, displayName }: RegisterInput) {
    const passwordHash = await this.passwords.hash(password);
    await this.users.createIfEmailFree({ email, displayName, passwordHash });
    return ok({ status: 'accepted' as const });
  }

  async login({ email, password }: LoginInput, client: SessionClient) {
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
    return toSessionResult(user, await this.sessions.start(account, client));
  }

  async refresh(token: string | undefined, client: SessionClient) {
    const { user, issued } = await this.sessions.refresh(token, client);
    return toSessionResult(user, issued);
  }

  logout(userId: string, token: string | undefined): Promise<void> {
    return this.sessions.end(userId, token);
  }

  logoutAll(userId: string): Promise<void> {
    return this.sessions.endAll(userId);
  }
}
