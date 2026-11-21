import { Injectable } from '@nestjs/common';
import { toStudyDay, type AdminStats } from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_DAYS = 30;
const RECENT_LIMIT = 5;

/** Đăng ký mới và số người hoạt động (khác nhau) mỗi ngày học, 30 ngày, cũ nhất trước. */
export function dailySeries(
  signups: Date[],
  sessions: { userId: string; startedAt: Date }[],
  now: Date,
) {
  const days = Array.from({ length: DAILY_DAYS }, (_, index) =>
    toStudyDay(new Date(now.getTime() - (DAILY_DAYS - 1 - index) * DAY_MS)),
  );
  const signupCount = new Map<string, number>();
  for (const date of signups) {
    const day = toStudyDay(date);
    signupCount.set(day, (signupCount.get(day) ?? 0) + 1);
  }
  const activeUsers = new Map<string, Set<string>>();
  for (const { userId, startedAt } of sessions) {
    const day = toStudyDay(startedAt);
    const set = activeUsers.get(day) ?? new Set<string>();
    set.add(userId);
    activeUsers.set(day, set);
  }
  return days.map((day) => ({
    day,
    signups: signupCount.get(day) ?? 0,
    active: activeUsers.get(day)?.size ?? 0,
  }));
}

@Injectable()
export class AdminStatsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /** Không tính tài khoản và bộ từ đã xoá. */
  async count(now = new Date()): Promise<AdminStats> {
    const activeUser = { deletedAt: null };
    const activeSet = { deletedAt: null };
    const since7 = new Date(now.getTime() - 7 * DAY_MS);
    const since30 = new Date(now.getTime() - (DAILY_DAYS - 1) * DAY_MS);
    const [
      users,
      lockedUsers,
      sets,
      hiddenSets,
      newUsers,
      active,
      sessions,
      publicSets,
      roles,
      signups30,
      sessions30,
      recentUsers,
      newPublicSets,
    ] = await Promise.all([
      this.prisma.user.count({ where: activeUser }),
      this.prisma.user.count({ where: { ...activeUser, lockedAt: { not: null } } }),
      this.prisma.studySet.count({ where: activeSet }),
      this.prisma.studySet.count({ where: { ...activeSet, hiddenAt: { not: null } } }),
      this.prisma.user.count({ where: { ...activeUser, createdAt: { gte: since7 } } }),
      this.prisma.studySession.groupBy({ by: ['userId'], where: { startedAt: { gte: since7 } } }),
      this.prisma.studySession.count({ where: { startedAt: { gte: since7 } } }),
      this.prisma.studySet.count({ where: { ...activeSet, visibility: 'PUBLIC' } }),
      this.prisma.user.groupBy({ by: ['role'], where: activeUser, _count: { _all: true } }),
      this.prisma.user.findMany({
        where: { ...activeUser, createdAt: { gte: since30 } },
        select: { createdAt: true },
      }),
      // Chỉ lấy hai cột để đếm người hoạt động theo ngày; đủ nhanh ở quy mô hiện tại.
      this.prisma.studySession.findMany({
        where: { startedAt: { gte: since30 } },
        select: { userId: true, startedAt: true },
      }),
      this.prisma.user.findMany({
        where: activeUser,
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
        select: { id: true, displayName: true, email: true, role: true, createdAt: true },
      }),
      this.prisma.studySet.findMany({
        where: { ...activeSet, visibility: 'PUBLIC', hiddenAt: null, createdAt: { gte: since7 } },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
        select: {
          id: true,
          title: true,
          createdAt: true,
          owner: { select: { displayName: true } },
          _count: { select: { cards: true } },
        },
      }),
    ]);
    const roleCount = (role: 'STUDENT' | 'TEACHER' | 'ADMIN') =>
      roles.find((item) => item.role === role)?._count._all ?? 0;
    return {
      users,
      lockedUsers,
      sets,
      hiddenSets,
      newUsers,
      activeUsers: active.length,
      sessions,
      publicSets,
      roles: {
        STUDENT: roleCount('STUDENT'),
        TEACHER: roleCount('TEACHER'),
        ADMIN: roleCount('ADMIN'),
      },
      daily: dailySeries(
        signups30.map(({ createdAt }) => createdAt),
        sessions30,
        now,
      ),
      recentUsers: recentUsers.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
      })),
      newPublicSets: newPublicSets.map(({ owner, _count, createdAt, ...set }) => ({
        ...set,
        ownerName: owner.displayName,
        cardCount: _count.cards,
        createdAt: createdAt.toISOString(),
      })),
    };
  }
}
