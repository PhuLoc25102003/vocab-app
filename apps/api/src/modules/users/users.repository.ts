import { Injectable } from '@nestjs/common';
import type { AuthUser, RegisterInput } from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const UNIQUE_VIOLATION = 'P2002';

type NewUser = Pick<RegisterInput, 'email' | 'displayName'> & { passwordHash: string };
export type UserCredentials = AuthUser & {
  passwordHash: string | null;
  tokenVersion: number;
};

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
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        passwordHash: true,
        tokenVersion: true,
      },
    });
  }
}
