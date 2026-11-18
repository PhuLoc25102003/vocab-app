import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BaseRepository } from '../base/base.repository';

export type OwnedResource = 'set' | 'session';

@Injectable()
export class OwnershipRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /** Trả id chủ sở hữu, hoặc `null` nếu tài nguyên không tồn tại hay đã xoá mềm. */
  async findOwnerId(resource: OwnedResource, id: string): Promise<string | null> {
    if (resource === 'set') {
      const set = await this.prisma.studySet.findFirst({
        where: { id, deletedAt: null },
        select: { ownerId: true },
      });
      return set?.ownerId ?? null;
    }

    const session = await this.prisma.studySession.findUnique({
      where: { id },
      select: { userId: true },
    });
    return session?.userId ?? null;
  }
}
