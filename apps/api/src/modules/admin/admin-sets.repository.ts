import { Injectable } from '@nestjs/common';
import type { AdminHiddenSetQuery, AdminSetQuery, HiddenSet } from '@vocab/shared';
import { paginated, toSkipTake } from '../../common/base/pagination';
import { BaseRepository } from '../../common/base/base.repository';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const HIDDEN_SET_SELECT = {
  id: true,
  title: true,
  hiddenAt: true,
  hiddenReason: true,
  hiddenById: true,
} as const;

@Injectable()
export class AdminSetsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /** Lấy danh sách bộ từ công khai và hỗ trợ lọc theo trạng thái (tất cả / đang hiển thị / bị ẩn). */
  async listPublicSets(query: AdminSetQuery) {
    const { skip, take } = toSkipTake(query);

    const where: Prisma.StudySetWhereInput = {
      deletedAt: null,
      OR: [{ visibility: 'PUBLIC' }, { hiddenAt: { not: null } }],
    };

    if (query.status === 'visible') {
      where.hiddenAt = null;
      where.visibility = 'PUBLIC';
    } else if (query.status === 'hidden') {
      where.hiddenAt = { not: null };
    }

    if (query.q) {
      where.AND = [
        {
          OR: [
            { title: { contains: query.q, mode: 'insensitive' } },
            { owner: { displayName: { contains: query.q, mode: 'insensitive' } } },
            { owner: { email: { contains: query.q, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.studySet.count({ where }),
      this.prisma.studySet.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          cardCount: true,
          visibility: true,
          hiddenAt: true,
          hiddenReason: true,
          hiddenById: true,
          createdAt: true,
          updatedAt: true,
          owner: { select: { id: true, displayName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    const adminIds = [
      ...new Set(items.map((i) => i.hiddenById).filter((id): id is string => Boolean(id))),
    ];
    const admins =
      adminIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: adminIds } },
            select: { id: true, displayName: true },
          })
        : [];
    const adminMap = new Map(admins.map((a) => [a.id, a]));

    const data = items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      cardCount: item.cardCount,
      visibility: item.visibility,
      hiddenAt: item.hiddenAt,
      hiddenReason: item.hiddenReason,
      owner: item.owner,
      hiddenBy: item.hiddenById ? (adminMap.get(item.hiddenById) ?? null) : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return paginated(data, total, query);
  }

  /** Lấy danh sách các bộ từ công khai đã bị ẩn kiểm duyệt. */
  async listHidden(query: AdminHiddenSetQuery) {
    return this.listPublicSets({ ...query, status: 'hidden' });
  }

  /** Trả `null` nếu bộ từ không tồn tại hoặc đã xoá. */
  async setHidden(
    id: string,
    hidden: { hiddenAt: Date; hiddenReason: string; hiddenById: string } | null,
  ): Promise<HiddenSet | null> {
    const { count } = await this.prisma.studySet.updateMany({
      where: { id, deletedAt: null },
      data: hidden ?? { hiddenAt: null, hiddenReason: null, hiddenById: null },
    });
    return count === 0
      ? null
      : this.prisma.studySet.findUnique({ where: { id }, select: HIDDEN_SET_SELECT });
  }
}
