import { Injectable } from '@nestjs/common';
import type { ClassListQuery } from '@vocab/shared';
import type { Prisma } from '../../generated/prisma/client';
import { BaseRepository } from '../../common/base/base.repository';
import { toSkipTake } from '../../common/base/pagination';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const CLASS_SELECT = {
  id: true,
  name: true,
  description: true,
  joinCode: true,
  archivedAt: true,
  createdAt: true,
  _count: { select: { members: true } },
} as const;

interface ClassRow {
  id: string;
  name: string;
  description: string | null;
  joinCode: string;
  archivedAt: Date | null;
  createdAt: Date;
  _count: { members: number };
}

function toClass({ _count, archivedAt, createdAt, ...rest }: ClassRow) {
  return {
    ...rest,
    archivedAt: archivedAt?.toISOString() ?? null,
    createdAt: createdAt.toISOString(),
    memberCount: _count.members,
  };
}

export interface ClassChanges {
  name?: string;
  description?: string | null;
  archivedAt?: Date | null;
  joinCode?: string;
}

@Injectable()
export class ClassesRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByTeacher(teacherId: string, query: ClassListQuery) {
    const where: Prisma.ClassWhereInput = {
      teacherId,
      archivedAt: query.archived ? { not: null } : null,
      ...(query.q ? { name: { contains: query.q, mode: 'insensitive' } } : {}),
    };
    const ORDER: Record<ClassListQuery['sort'], Prisma.ClassOrderByWithRelationInput> = {
      '-createdAt': { createdAt: 'desc' },
      name: { name: 'asc' },
      '-memberCount': { members: { _count: 'desc' } },
    };
    const [rows, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        select: CLASS_SELECT,
        orderBy: [ORDER[query.sort], { createdAt: 'desc' }, { id: 'asc' }],
        ...toSkipTake(query),
      }),
      this.prisma.class.count({ where }),
    ]);
    return { items: rows.map(toClass), total };
  }

  /** Bài giao, học sinh và bài nộp đúng hạn từ `since` để tính số liệu nhanh của các lớp. */
  async findListStatsInput(classIds: string[], since: Date, now: Date) {
    if (classIds.length === 0) return { assignments: [], members: [], onTime: [] };
    const classId = { in: classIds };
    const [assignments, members, onTime] = await Promise.all([
      this.prisma.assignment.findMany({
        where: { classId, set: { deletedAt: null } },
        select: { id: true, classId: true, dueAt: true },
      }),
      this.prisma.classMember.findMany({
        where: { classId, user: { deletedAt: null } },
        select: { classId: true, userId: true, joinedAt: true },
      }),
      this.prisma.assignmentSubmission.findMany({
        where: {
          late: false,
          assignment: { classId, set: { deletedAt: null }, dueAt: { gte: since, lte: now } },
        },
        select: { assignmentId: true, userId: true },
      }),
    ]);
    return { assignments, members, onTime };
  }

  async findById(id: string) {
    const row = await this.prisma.class.findUnique({ where: { id }, select: CLASS_SELECT });
    return row ? toClass(row) : null;
  }

  async create(
    teacherId: string,
    data: { name: string; description: string | null },
    joinCode: string,
  ) {
    const row = await this.prisma.class.create({
      data: { teacherId, ...data, joinCode },
      select: CLASS_SELECT,
    });
    return toClass(row);
  }

  async update(id: string, changes: ClassChanges) {
    const row = await this.prisma.class.update({
      where: { id },
      data: changes,
      select: CLASS_SELECT,
    });
    return toClass(row);
  }
}
