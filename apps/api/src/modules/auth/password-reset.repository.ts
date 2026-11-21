import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../common/base/base.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class PasswordResetRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /** Liên kết mới làm các liên kết cũ chưa dùng hết hiệu lực. */
  async replaceToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } }),
      this.prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } }),
    ]);
  }

  /**
   * Đánh dấu token đã dùng, đổi mật khẩu và kết thúc mọi phiên trong một transaction.
   * Trả `false` nếu token sai, hết hạn hoặc đã dùng.
   */
  resetPassword(tokenHash: string, passwordHash: string, now: Date): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const token = await tx.passwordResetToken.findFirst({
        where: { tokenHash, usedAt: null, expiresAt: { gt: now }, user: { deletedAt: null } },
        select: { id: true, userId: true },
      });
      if (!token) return false;
      // Điều kiện `usedAt: null` chặn hai request dùng cùng token chạy song song.
      const { count } = await tx.passwordResetToken.updateMany({
        where: { id: token.id, usedAt: null },
        data: { usedAt: now },
      });
      if (count === 0) return false;
      await tx.user.update({
        where: { id: token.userId },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      });
      await tx.refreshSession.deleteMany({ where: { userId: token.userId } });
      return true;
    });
  }
}
