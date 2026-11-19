import { Injectable } from '@nestjs/common';
import type { Role } from '@vocab/shared';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BaseRepository } from '../base/base.repository';

export interface TokenUser {
  id: string;
  role: Role;
  tokenVersion: number;
}

@Injectable()
export class TokenUserRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findActiveById(id: string): Promise<TokenUser | null> {
    return this.prisma.user.findFirst({
      // Tài khoản bị khoá coi như không còn hiệu lực.
      where: { id, deletedAt: null, lockedAt: null },
      select: { id: true, role: true, tokenVersion: true },
    });
  }
}
