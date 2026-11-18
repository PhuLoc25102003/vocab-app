import { Injectable } from '@nestjs/common';
import type { RegisterInput } from '@vocab/shared';
import { ok } from '../../common/base/pagination';
import { UsersRepository } from '../users/users.repository';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly passwords: PasswordService,
  ) {}

  /** Email đã có hay chưa đều hash và trả cùng kết quả, để không lộ email đã đăng ký. */
  async register({ email, password, displayName }: RegisterInput) {
    const passwordHash = await this.passwords.hash(password);
    await this.users.createIfEmailFree({ email, displayName, passwordHash });
    return ok({ status: 'accepted' as const });
  }
}
