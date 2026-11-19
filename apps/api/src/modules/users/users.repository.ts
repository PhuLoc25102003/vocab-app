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
  lockedAt: true,
} as const;

type NewUser = Pick<RegisterInput, 'email' | 'displayName'> & { passwordHash: string };
type NewGoogleUser = Pick<RegisterInput, 'email' | 'displayName'> & { googleId: string };
export type Account = AuthUser & { tokenVersion: number; lockedAt: Date | null };
export type UserCredentials = Account & { passwordHash: string | null };

@Injectable()
export class UsersRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /** Trả `false` nếu email đã tồn tại. */
  async createIfEmailFree(data: NewUser): Promise<boolean> {
    return (await this.createUnlessTaken(data)) !== null;
  }

  /** Trả `null` nếu email hoặc Google ID đã được dùng. */
  createGoogleUserIfFree(data: NewGoogleUser): Promise<Account | null> {
    return this.createUnlessTaken(data);
  }

  findByGoogleId(googleId: string): Promise<Account | null> {
    return this.prisma.user.findFirst({
      where: { googleId, deletedAt: null },
      select: ACCOUNT_SELECT,
    });
  }

  /**
   * Gắn Google vào tài khoản cùng email. Đăng ký bằng mật khẩu chưa xác minh email, nên
   * mật khẩu và các phiên cũ có thể thuộc người khác và phải hết hiệu lực.
   */
  linkGoogleByEmail(email: string, googleId: string): Promise<Account | null> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.user.updateMany({
        where: { email, googleId: null, deletedAt: null },
        data: { googleId, passwordHash: null, tokenVersion: { increment: 1 } },
      });
      if (count === 0) {
        return null;
      }
      const account = await tx.user.findUniqueOrThrow({
        where: { email },
        select: ACCOUNT_SELECT,
      });
      await tx.refreshSession.deleteMany({ where: { userId: account.id } });
      return account;
    });
  }

  private async createUnlessTaken(data: NewUser | NewGoogleUser): Promise<Account | null> {
    try {
      return await this.prisma.user.create({ data, select: ACCOUNT_SELECT });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_VIOLATION
      ) {
        return null;
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

  /** Xoá hẳn. Dữ liệu liên quan bị xoá theo `onDelete: Cascade`. */
  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id }, select: { id: true } });
  }
}
