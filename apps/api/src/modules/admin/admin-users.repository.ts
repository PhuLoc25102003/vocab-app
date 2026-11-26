import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ERROR_CODES,
  type AdminRecentStudyMode,
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

type SessionWithAttempts = {
  setId: string;
  mode: string;
  startedAt: Date;
  finishedAt: Date | null;
  correct: number;
  total: number;
  set: { id: string; title: string; cardCount: number } | null;
  attempts: { cardId: string; isCorrect: boolean }[];
};

function summarizeAttempts(attempts: { cardId: string; isCorrect: boolean }[]) {
  const firstResults = new Map<string, boolean>();
  for (const { cardId, isCorrect } of attempts) {
    if (!firstResults.has(cardId)) {
      firstResults.set(cardId, isCorrect);
    }
  }
  let correct = 0;
  for (const ok of firstResults.values()) {
    if (ok) correct += 1;
  }
  return { answered: firstResults.size, correct };
}

function buildRecentSets(sessions: SessionWithAttempts[]): AdminRecentStudySet[] {
  const bySet = new Map<
    string,
    {
      title: string;
      cardCount: number;
      seenModes: Set<string>;
      modes: AdminRecentStudyMode[];
    }
  >();

  for (const s of sessions) {
    if (!s.set) continue;
    let entry = bySet.get(s.setId);
    if (!entry) {
      if (bySet.size >= 5) continue;
      entry = {
        title: s.set.title,
        cardCount: s.set.cardCount,
        seenModes: new Set(),
        modes: [],
      };
      bySet.set(s.setId, entry);
    }
    if (entry.seenModes.has(s.mode)) continue;
    entry.seenModes.add(s.mode);

    const { answered, correct } =
      s.attempts.length > 0
        ? summarizeAttempts(s.attempts)
        : { answered: s.finishedAt ? s.total : 0, correct: s.correct };

    entry.modes.push({
      mode: s.mode,
      startedAt: s.startedAt,
      finishedAt: s.finishedAt,
      answered,
      correct,
      total: s.total > 0 ? s.total : s.set.cardCount,
    });
  }

  return [...bySet.entries()].map(([setId, entry]) => {
    const latest = entry.modes[0]!;
    return {
      setId,
      title: entry.title,
      cardCount: entry.cardCount,
      mode: latest.mode,
      startedAt: latest.startedAt,
      correct: latest.correct,
      total: latest.total,
      modes: entry.modes,
    };
  });
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
            take: 50,
            select: {
              setId: true,
              mode: true,
              startedAt: true,
              finishedAt: true,
              correct: true,
              total: true,
              set: {
                select: {
                  id: true,
                  title: true,
                  cardCount: true,
                },
              },
              attempts: {
                orderBy: { createdAt: 'asc' },
                select: {
                  cardId: true,
                  isCorrect: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const mappedUsers: AdminUser[] = users.map((u) => {
      const recentSets = buildRecentSets(u.studySessions);

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
