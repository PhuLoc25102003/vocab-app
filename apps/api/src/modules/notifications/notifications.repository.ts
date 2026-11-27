import { Injectable } from '@nestjs/common';
import type { NotificationData, NotificationType, Pagination } from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { toSkipTake } from '../../common/base/pagination';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export interface NewNotification {
  type: NotificationType;
  data: NotificationData;
  href: string | null;
}

const NOTIFICATION_SELECT = {
  id: true,
  type: true,
  data: true,
  href: true,
  readAt: true,
  createdAt: true,
} as const;

@Injectable()
export class NotificationsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async createForUsers(userIds: readonly string[], { type, data, href }: NewNotification) {
    if (userIds.length === 0) return;
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, type, data, href })),
    });
  }

  async createMany(rows: readonly ({ userId: string } & NewNotification)[]) {
    if (rows.length === 0) return;
    await this.prisma.notification.createMany({
      data: rows.map(({ userId, type, data, href }) => ({ userId, type, data, href })),
    });
  }

  /** Tên lớp và id học sinh trong lớp. */
  findClassMembers(classId: string) {
    return this.prisma.class.findUnique({
      where: { id: classId },
      select: { name: true, members: { select: { userId: true } } },
    });
  }

  async findPage(userId: string, query: Pagination) {
    const where = { userId };
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...toSkipTake(query),
        select: NOTIFICATION_SELECT,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return { items, total };
  }

  countUnread(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  /** Chỉ đánh dấu được thông báo của chính mình. Trả false nếu không có. */
  async markRead(userId: string, id: string, now: Date): Promise<boolean> {
    const found = await this.prisma.notification.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!found) return false;
    await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: now },
    });
    return true;
  }

  async markAllRead(userId: string, now: Date): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: now },
    });
  }

  async deleteOlderThan(userId: string, before: Date): Promise<void> {
    await this.prisma.notification.deleteMany({ where: { userId, createdAt: { lt: before } } });
  }
}
