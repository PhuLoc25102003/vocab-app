import { PublicSetCache } from '../sets/public-set-cache';
import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ERROR_CODES,
  type AuthUser,
  type DeleteAccountInput,
  type UpdateAccountInput,
} from '@vocab/shared';
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
    private readonly setCache: PublicSetCache,
  ) {}

  async getMe(userId: string) {
    const account = await this.requireAccount(userId);
    return ok({ user: { ...toAuthUser(account), hasPassword: account.passwordHash !== null } });
  }

  async updateMe(
    userId: string,
    { displayName, currentPassword, newPassword }: UpdateAccountInput,
    client: SessionClient,
  ) {
    if (!newPassword) {
      // Schema bảo đảm có `displayName` khi không đổi mật khẩu.
      const account = await this.users.updateDisplayName(userId, displayName as string);
      // Bộ từ công khai trong cache còn giữ tên cũ.
      await this.setCache.invalidateOwner(userId);
      return { body: ok({ user: toAuthUser(account) }), session: null };
    }

    const current = await this.requireAccount(userId);
    await this.assertPassword(current, currentPassword);
    const passwordHash = await this.passwords.hash(newPassword);
    const account = await this.users.changePassword(userId, passwordHash, displayName);
    if (displayName) await this.setCache.invalidateOwner(userId);
    // Mọi phiên cũ đã kết thúc, thiết bị đang dùng nhận phiên mới để không bị đăng xuất.
    const session = await this.sessions.start(account, client);
    return {
      body: ok({ user: toAuthUser(account), accessToken: session.accessToken }),
      session,
    };
  }

  async deleteMe(userId: string, { password }: DeleteAccountInput): Promise<void> {
    const account = await this.requireAccount(userId);
    // Tài khoản chỉ đăng nhập bằng Google không có mật khẩu để xác nhận.
    if (account.passwordHash) {
      await this.assertPassword(account, password);
    }
    await this.users.delete(userId);
    await this.setCache.invalidateOwner(userId);
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
