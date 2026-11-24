import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ERROR_CODES,
  type AdminRecentStudySet,
  type AdminUser,
  type AdminUserQuery,
  type Role,
} from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { toSkipTake } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import { UserPresenceService } from '../../common/auth/user-presence.service';
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
  constructor(
    prisma: PrismaService,
    private readonly presence: UserPresenceService,
  ) {
    super(prisma);
  }

  async findMany(query: AdminUserQuery): Promise<[AdminUser[], number]> {
    const { q, role, status } = query;
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const onlineIds = this.presence.getOnlineUserIds();

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(role ? { role } : {}),
      ...(status === 'locked'
        ? { lockedAt: { not: null } }
        : status === 'active'
          ? { lockedAt: null }
          : status === 'online'
            ? {
                lockedAt: null,
                OR: [
                  ...(onlineIds.length > 0 ? [{ id: { in: onlineIds } }] : []),
                  { studySessions: { some: { startedAt: { gte: fifteenMinutesAgo } } } },
                  { cardProgress: { some: { updatedAt: { gte: fifteenMinutesAgo } } } },
                ],
              }
            : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { displayName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [users, count] = await Promise.all([
      this.prisma.user.findMany({
        where,
        ...toSkipTake(query),
        orderBy: toOrderBy(query.sort),
        select: {
          ...ADMIN_USER_SELECT,
          updatedAt: true,
          studySessions: {
            orderBy: { startedAt: 'desc' },
            take: 10,
            select: {
              setId: true,
              mode: true,
              startedAt: true,
              correct: true,
              total: true,
              set: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const mappedUsers: AdminUser[] = users.map((u) => {
      const recentSets: AdminRecentStudySet[] = [];
      const seenSets = new Set<string>();
      for (const s of u.studySessions) {
        if (!seenSets.has(s.setId) && s.set) {
          seenSets.add(s.setId);
          recentSets.push({
            setId: s.setId,
            title: s.set.title,
            mode: s.mode,
            startedAt: s.startedAt,
            correct: s.correct,
            total: s.total,
          });
        }
        if (recentSets.length >= 5) break;
      }

      const memoryActive = this.presence.getLastActive(u.id);
      const sessionActive = u.studySessions[0]?.startedAt;
      const lastActiveAt =
        [memoryActive, sessionActive, u.updatedAt]
          .filter((d): d is Date => d instanceof Date)
          .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

      const isOnline =
        !u.lockedAt &&
        (this.presence.isOnline(u.id) ||
          (lastActiveAt ? Date.now() - lastActiveAt.getTime() < 15 * 60 * 1000 : false));

      return {
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        createdAt: u.createdAt,
        lockedAt: u.lockedAt,
        lockReason: u.lockReason,
        lockedById: u.lockedById,
        isOnline,
        lastActiveAt,
        recentSets,
      };
    });

    return [mappedUsers, count];
  }

  private mapSingleUser(
    u: {
      id: string;
      email: string;
      displayName: string;
      role: Role;
      createdAt: Date;
      lockedAt: Date | null;
      lockReason: string | null;
      lockedById: string | null;
    } | null,
  ): AdminUser | null {
    if (!u) return null;
    return {
      ...u,
      isOnline: this.presence.isOnline(u.id),
      lastActiveAt: this.presence.getLastActive(u.id),
      recentSets: [],
    };
  }

  /**
   * Khoá tài khoản, tăng `tokenVersion` để access token cũ hết hiệu lực và xoá mọi phiên refresh.
   * Trả `null` nếu không tìm thấy tài khoản.
   */
  async lock(id: string, adminId: string, reason: string): Promise<AdminUser | null> {
    const raw = await this.prisma.$transaction(async (tx) => {
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
    return this.mapSingleUser(raw);
  }

  /** Trả `null` nếu không tìm thấy tài khoản. */
  async unlock(id: string): Promise<AdminUser | null> {
    const { count } = await this.prisma.user.updateMany({
      where: { id, deletedAt: null },
      data: { lockedAt: null, lockReason: null, lockedById: null },
    });
    if (count === 0) return null;
    const raw = await this.prisma.user.findUnique({ where: { id }, select: ADMIN_USER_SELECT });
    return this.mapSingleUser(raw);
  }

  async setRole(id: string, role: Role): Promise<AdminUser | null> {
    const { count } = await this.prisma.user.updateMany({
      where: { id, deletedAt: null },
      data: { role },
    });
    if (count === 0) return null;
    const raw = await this.prisma.user.findUnique({ where: { id }, select: ADMIN_USER_SELECT });
    return this.mapSingleUser(raw);
  }
}
