import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ERROR_CODES,
  type AuthUser,
  type GoogleLoginInput,
  type LoginInput,
  type RegisterInput,
} from '@vocab/shared';
import { ok } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import { resolveWebOrigin, type Env } from '../../config/env';
import { UsersRepository, type Account } from '../users/users.repository';
import { AuthSessionService, type IssuedSession, type SessionClient } from './auth-session.service';
import { GoogleIdentityService } from './google-identity.service';
import { PasswordService } from './password.service';

function toAuthUser({ id, email, displayName, role }: Account): AuthUser {
  return { id, email, displayName, role };
}

/** Tài khoản bị ADMIN khoá không được tạo phiên mới. Chỉ báo sau khi đã xác thực xong. */
function assertNotLocked(account: Account) {
  if (account.lockedAt) {
    throw new AppError(
      ERROR_CODES.ACCOUNT_LOCKED,
      'Tài khoản đã bị khoá. Hãy liên hệ quản trị viên.',
      HttpStatus.FORBIDDEN,
    );
  }
}

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
    private readonly google: GoogleIdentityService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** Trang đăng nhập của web, nơi API chuyển về sau luồng redirect của Google. */
  webLoginUrl(query: URLSearchParams): string {
    const origin = resolveWebOrigin(
      this.config.get('WEB_ORIGIN', { infer: true }),
      this.config.get('CORS_ORIGINS', { infer: true }),
    );
    return `${origin}/login?${query.toString()}`;
  }

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
    assertNotLocked(account);

    return toSessionResult(toAuthUser(account), await this.sessions.start(account, client));
  }

  /** Google đã xác minh email, nên email trùng được gộp vào tài khoản có sẵn. */
  async loginWithGoogle({ credential }: GoogleLoginInput, client: SessionClient, nonce?: string) {
    const identity = await this.google.verify(credential, nonce);
    const account =
      (await this.users.findByGoogleId(identity.googleId)) ??
      (await this.users.linkGoogleByEmail(identity.email, identity.googleId)) ??
      (await this.users.createGoogleUserIfFree(identity)) ??
      // Một request khác có thể vừa tạo chính tài khoản này.
      (await this.users.findByGoogleId(identity.googleId));
    if (!account) {
      throw new AppError(
        ERROR_CODES.GOOGLE_EMAIL_IN_USE,
        'Email này đã gắn với một tài khoản Google khác.',
        HttpStatus.CONFLICT,
      );
    }
    assertNotLocked(account);
    return toSessionResult(toAuthUser(account), await this.sessions.start(account, client));
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
