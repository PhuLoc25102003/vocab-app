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

  findByTokenHash(tokenHash: string) {
    return this.prisma.refreshSession.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        familyId: true,
        expiresAt: true,
        revokedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            tokenVersion: true,
            deletedAt: true,
            lockedAt: true,
          },
        },
      },
    });
  }

  /** Thu hồi phiên cũ và tạo phiên mới. Trả `false` nếu request khác đã xoay vòng trước. */
  rotate(sessionId: string, next: NewRefreshSession): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const { count } = await tx.refreshSession.updateMany({
        where: { id: sessionId, revokedAt: null },
        data: { revokedAt: now },
      });
      if (count === 0) {
        return false;
      }
      await tx.refreshSession.create({ data: next, select: { id: true } });
      await tx.refreshSession.deleteMany({
        where: { familyId: next.familyId, expiresAt: { lt: now } },
      });
      return true;
    });
  }

  async deleteFamily(familyId: string): Promise<void> {
    await this.prisma.refreshSession.deleteMany({ where: { familyId } });
  }

  /** Chỉ xoá khi token thuộc đúng người dùng đang đăng xuất. */
  async deleteFamilyOfToken(userId: string, tokenHash: string): Promise<void> {
    const session = await this.prisma.refreshSession.findFirst({
      where: { userId, tokenHash },
      select: { familyId: true },
    });
    if (session) {
      await this.deleteFamily(session.familyId);
    }
  }

  /** Xoá mọi phiên và làm mọi access token cũ mất hiệu lực. */
  async endAllForUser(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.refreshSession.deleteMany({ where: { userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
        select: { id: true },
      }),
    ]);
  }
}
