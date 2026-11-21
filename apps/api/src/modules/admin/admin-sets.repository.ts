import { Injectable } from '@nestjs/common';
import type { HiddenSet } from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const HIDDEN_SET_SELECT = {
  id: true,
  title: true,
  hiddenAt: true,
  hiddenReason: true,
  hiddenById: true,
} as const;

@Injectable()
export class AdminSetsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /** Trả `null` nếu bộ từ không tồn tại hoặc đã xoá. */
  async setHidden(
    id: string,
    hidden: { hiddenAt: Date; hiddenReason: string; hiddenById: string } | null,
  ): Promise<HiddenSet | null> {
    const { count } = await this.prisma.studySet.updateMany({
      where: { id, deletedAt: null },
      data: hidden ?? { hiddenAt: null, hiddenReason: null, hiddenById: null },
    });
    return count === 0
      ? null
      : this.prisma.studySet.findUnique({ where: { id }, select: HIDDEN_SET_SELECT });
  }
}
