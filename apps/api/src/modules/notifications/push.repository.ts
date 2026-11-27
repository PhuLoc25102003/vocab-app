import { Injectable } from '@nestjs/common';
import type { PushSubscriptionInput } from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class PushRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /** Một endpoint chỉ thuộc một người: đăng nhập tài khoản khác trên cùng máy thì chuyển chủ. */
  async upsert(userId: string, { endpoint, keys }: PushSubscriptionInput): Promise<void> {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      update: { userId, p256dh: keys.p256dh, auth: keys.auth },
      select: { id: true },
    });
  }

  async deleteForUser(userId: string, endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
  }

  async deleteEndpoints(endpoints: readonly string[]): Promise<void> {
    if (endpoints.length === 0) return;
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint: { in: [...endpoints] } } });
  }

  findForUsers(userIds: readonly string[]) {
    return this.prisma.pushSubscription.findMany({
      where: { userId: { in: [...userIds] } },
      select: { userId: true, endpoint: true, p256dh: true, auth: true },
    });
  }
}
