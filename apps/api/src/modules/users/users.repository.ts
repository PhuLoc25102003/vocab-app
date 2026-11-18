import { Injectable } from '@nestjs/common';
import type { AuthUser, RegisterInput } from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const UNIQUE_VIOLATION = 'P2002';

const ACCOUNT_SELECT = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  tokenVersion: true,
} as const;

type NewUser = Pick<RegisterInput, 'email' | 'displayName'> & { passwordHash: string };
export type Account = AuthUser & { tokenVersion: number };
export type UserCredentials = Account & { passwordHash: string | null };

@Injectable()
export class UsersRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /** Trả `false` nếu email đã tồn tại. */
  async createIfEmailFree(data: NewUser): Promise<boolean> {
    try {
      await this.prisma.user.create({ data, select: { id: true } });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_VIOLATION
      ) {
        return false;
      }
      throw error;
    }
  }

  findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: { ...ACCOUNT_SELECT, passwordHash: true },
    });
  }

  findCredentialsById(id: string): Promise<UserCredentials | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { ...ACCOUNT_SELECT, passwordHash: true },
    });
  }

  updateDisplayName(id: string, displayName: string): Promise<Account> {
    return this.prisma.user.update({
      where: { id },
      data: { displayName },
      select: ACCOUNT_SELECT,
    });
  }

  /** Đổi mật khẩu và kết thúc mọi phiên cũ trong cùng một transaction. */
  async changePassword(id: string, passwordHash: string, displayName?: string): Promise<Account> {
    const [, account] = await this.prisma.$transaction([
      this.prisma.refreshSession.deleteMany({ where: { userId: id } }),
      this.prisma.user.update({
        where: { id },
        data: { passwordHash, displayName, tokenVersion: { increment: 1 } },
        select: ACCOUNT_SELECT,
      }),
    ]);
    return account;
  }
}
