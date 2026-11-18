import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../common/base/base.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export interface NewRefreshSession {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  userAgent: string | null;
  ip: string | null;
  expiresAt: Date;
}

@Injectable()
export class RefreshSessionRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: NewRefreshSession): Promise<void> {
    await this.prisma.refreshSession.create({ data, select: { id: true } });
  }
}
