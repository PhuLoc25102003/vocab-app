import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES, type AuthUser, type UpdateAccountInput } from '@vocab/shared';
import { unauthorizedError } from '../../common/auth/access-token.service';
import { ok } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import { AuthSessionService, type SessionClient } from '../auth/auth-session.service';
import { PasswordService } from '../auth/password.service';
import { UsersRepository, type Account, type UserCredentials } from './users.repository';

function toAuthUser({ id, email, displayName, role }: Account): AuthUser {
  return { id, email, displayName, role };
}

@Injectable()
export class UsersService {
  constructor(
    private readonly users: UsersRepository,
    private readonly passwords: PasswordService,
    private readonly sessions: AuthSessionService,
  ) {}

  async getMe(userId: string) {
    return ok({ user: toAuthUser(await this.requireAccount(userId)) });
  }

  async updateMe(
    userId: string,
    { displayName, currentPassword, newPassword }: UpdateAccountInput,
    client: SessionClient,
  ) {
    if (!newPassword) {
      // Schema bảo đảm có `displayName` khi không đổi mật khẩu.
      const account = await this.users.updateDisplayName(userId, displayName as string);
      return { body: ok({ user: toAuthUser(account) }), session: null };
    }

    const current = await this.requireAccount(userId);
    await this.assertPassword(current, currentPassword);
    const passwordHash = await this.passwords.hash(newPassword);
    const account = await this.users.changePassword(userId, passwordHash, displayName);
    // Mọi phiên cũ đã kết thúc, thiết bị đang dùng nhận phiên mới để không bị đăng xuất.
    const session = await this.sessions.start(account, client);
    return {
      body: ok({ user: toAuthUser(account), accessToken: session.accessToken }),
      session,
    };
  }

  private async requireAccount(userId: string): Promise<UserCredentials> {
    const account = await this.users.findCredentialsById(userId);
    if (!account) {
      throw unauthorizedError();
    }
    return account;
  }

  private async assertPassword(account: UserCredentials, password = ''): Promise<void> {
    if (!(await this.passwords.verify(account.passwordHash, password))) {
      throw new AppError(
        ERROR_CODES.WRONG_PASSWORD,
        'Mật khẩu hiện tại không đúng',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
