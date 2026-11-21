import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES, type AdminUser, type AdminUserQuery, type Role } from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { toSkipTake } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const SORTABLE_FIELDS = ['createdAt', 'email', 'displayName'] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];

const ADMIN_USER_SELECT = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  createdAt: true,
  lockedAt: true,
  lockReason: true,
  lockedById: true,
} as const;

function toOrderBy(sort: string): Prisma.UserOrderByWithRelationInput[] {
  const direction = sort.startsWith('-') ? 'desc' : 'asc';
  const field = sort.replace(/^-/, '');
  if (!SORTABLE_FIELDS.includes(field as SortableField)) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Dữ liệu không hợp lệ',
      HttpStatus.BAD_REQUEST,
      [{ path: 'sort', code: 'invalid_value', message: 'Không sắp xếp được theo trường này' }],
    );
  }
  // Thêm id để thứ tự không đổi giữa các trang khi giá trị trùng nhau.
  return [{ [field]: direction }, { id: 'asc' }];
}

@Injectable()
export class AdminUsersRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findMany(query: AdminUserQuery): Promise<[AdminUser[], number]> {
    const { q, role, status } = query;
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(role ? { role } : {}),
      ...(status ? { lockedAt: status === 'locked' ? { not: null } : null } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { displayName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    return Promise.all([
      this.prisma.user.findMany({
        where,
        ...toSkipTake(query),
        orderBy: toOrderBy(query.sort),
        select: ADMIN_USER_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);
  }

  /**
   * Khoá tài khoản, tăng `tokenVersion` để access token cũ hết hiệu lực và xoá mọi phiên refresh.
   * Trả `null` nếu không tìm thấy tài khoản.
   */
  lock(id: string, adminId: string, reason: string): Promise<AdminUser | null> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.user.updateMany({
        where: { id, deletedAt: null },
        data: {
          lockedAt: new Date(),
          lockReason: reason,
          lockedById: adminId,
          tokenVersion: { increment: 1 },
        },
      });
      if (count === 0) {
        return null;
      }
      await tx.refreshSession.deleteMany({ where: { userId: id } });
      return tx.user.findUnique({ where: { id }, select: ADMIN_USER_SELECT });
    });
  }

  /** Trả `null` nếu không tìm thấy tài khoản. */
  async unlock(id: string): Promise<AdminUser | null> {
    const { count } = await this.prisma.user.updateMany({
      where: { id, deletedAt: null },
      data: { lockedAt: null, lockReason: null, lockedById: null },
    });
    return count === 0
      ? null
      : this.prisma.user.findUnique({ where: { id }, select: ADMIN_USER_SELECT });
  }

  async setRole(id: string, role: Role): Promise<AdminUser | null> {
    const { count } = await this.prisma.user.updateMany({
      where: { id, deletedAt: null },
      data: { role },
    });
    return count === 0
      ? null
      : this.prisma.user.findUnique({ where: { id }, select: ADMIN_USER_SELECT });
  }
}
