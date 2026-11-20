import { Injectable } from '@nestjs/common';
import type { Pagination, StudyMode } from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { toSkipTake } from '../../common/base/pagination';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const ASSIGNMENT_SELECT = {
  id: true,
  classId: true,
  setId: true,
  mode: true,
  dueAt: true,
  createdAt: true,
  set: { select: { title: true } },
} as const;

interface AssignmentRow {
  id: string;
  classId: string;
  setId: string;
  mode: StudyMode;
  dueAt: Date | null;
  createdAt: Date;
  set: { title: string };
}

function toAssignment({ set, dueAt, createdAt, ...rest }: AssignmentRow) {
  return {
    ...rest,
    setTitle: set.title,
    dueAt: dueAt?.toISOString() ?? null,
    createdAt: createdAt.toISOString(),
  };
}

@Injectable()
export class AssignmentsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /** Bộ đã xoá mềm coi như không tồn tại. */
  findSet(setId: string) {
    return this.prisma.studySet.findFirst({
      where: { id: setId, deletedAt: null },
      select: { ownerId: true, visibility: true },
    });
  }

  async create(data: { classId: string; setId: string; mode: StudyMode; dueAt: Date | null }) {
    const row = await this.prisma.assignment.create({ data, select: ASSIGNMENT_SELECT });
    return toAssignment(row);
  }

  /** Hạn gần nhất lên trước, bài không có hạn xếp cuối. */
  async findByClass(classId: string, query: Pagination) {
    const where = { classId, set: { deletedAt: null } };
    const [rows, total] = await Promise.all([
      this.prisma.assignment.findMany({
        where,
        select: ASSIGNMENT_SELECT,
        orderBy: [{ dueAt: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }, { id: 'asc' }],
        ...toSkipTake(query),
      }),
      this.prisma.assignment.count({ where }),
    ]);
    return { items: rows.map(toAssignment), total };
  }

  /** Trả `false` nếu bài giao không thuộc lớp này. */
  async delete(classId: string, id: string): Promise<boolean> {
    const { count } = await this.prisma.assignment.deleteMany({ where: { id, classId } });
    return count > 0;
  }
}
