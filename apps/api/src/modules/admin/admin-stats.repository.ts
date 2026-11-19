import { Injectable } from '@nestjs/common';
import type { AdminStats } from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class AdminStatsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /** Không tính tài khoản và bộ từ đã xoá. */
  async count(): Promise<AdminStats> {
    const activeUser = { deletedAt: null };
    const activeSet = { deletedAt: null };
    const [users, lockedUsers, sets, hiddenSets] = await Promise.all([
      this.prisma.user.count({ where: activeUser }),
      this.prisma.user.count({ where: { ...activeUser, lockedAt: { not: null } } }),
      this.prisma.studySet.count({ where: activeSet }),
      this.prisma.studySet.count({ where: { ...activeSet, hiddenAt: { not: null } } }),
    ]);
    return { users, lockedUsers, sets, hiddenSets };
  }
}
