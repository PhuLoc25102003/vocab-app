import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../common/base/base.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class HealthRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async ping(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
