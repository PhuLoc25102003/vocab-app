import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES, type AdminUser, type AdminUserQuery } from '@vocab/shared';
import { ok, paginated } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import { AdminUsersRepository } from './admin-users.repository';

function found(user: AdminUser | null) {
  if (!user) {
    throw new AppError(
      ERROR_CODES.USER_NOT_FOUND,
      'Không tìm thấy người dùng',
      HttpStatus.NOT_FOUND,
    );
  }
  return ok(user);
}

@Injectable()
export class AdminUsersService {
  constructor(private readonly users: AdminUsersRepository) {}

  async list(query: AdminUserQuery) {
    const [items, total] = await this.users.findMany(query);
    return paginated(items, total, query);
  }

  async lock(id: string, adminId: string, reason: string) {
    if (id === adminId) {
      throw new AppError(
        ERROR_CODES.CANNOT_LOCK_SELF,
        'Bạn không thể tự khoá tài khoản của mình',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    return found(await this.users.lock(id, adminId, reason));
  }

  async unlock(id: string) {
    return found(await this.users.unlock(id));
  }
}
