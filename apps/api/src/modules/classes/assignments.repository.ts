import { Injectable } from '@nestjs/common';
import type { Pagination, StudyMode } from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { toSkipTake } from '../../common/base/pagination';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/** Lỗi trùng khoá chính của Prisma: hai yêu cầu nộp bài đến cùng lúc. */
function isUniqueViolation(error: unknown): boolean {
  return error instanceof Object && 'code' in error && error.code === 'P2002';
}

/** Học sinh hiếm khi có quá ngần này bài; danh sách bài cần làm sắp theo trạng thái trong bộ nhớ. */
export const MEMBER_ASSIGNMENT_LIMIT = 500;

const ASSIGNMENT_SELECT = {
  id: true,
  classId: true,
  setId: true,
  mode: true,
  modes: true,
  dueAt: true,
  createdAt: true,
  set: { select: { title: true } },
} as const;

interface AssignmentRow {
  id: string;
  classId: string;
  setId: string;
  mode: StudyMode;
  modes: StudyMode[];
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
      select: { ownerId: true, visibility: true, cardCount: true },
    });
  }

  /** Tạo bài giao; `shareSet` đổi bộ riêng tư sang `CLASS` trong cùng transaction. */
  async create(data: {
    classId: string;
    setId: string;
    modes: StudyMode[];
    dueAt: Date | null;
    shareSet: boolean;
  }) {
    const { shareSet, modes, ...rest } = data;
    const row = await this.prisma.$transaction(async (tx) => {
      if (shareSet) {
        await tx.studySet.update({ where: { id: rest.setId }, data: { visibility: 'CLASS' } });
      }
      // `mode` giữ chế độ đầu cho code cũ đọc tới khi xoá cột (docs/02-database.md, việc 5.10).
      return tx.assignment.create({
        data: { ...rest, mode: modes[0] ?? 'FLASHCARD', modes },
        select: ASSIGNMENT_SELECT,
      });
    });
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

  /**
   * Bài giao của các lớp người học đã tham gia, lớp chưa lưu trữ và bộ chưa xoá.
   * Kèm lần học xong đầu tiên đúng bộ và chế độ, tính từ lúc giao.
   */
  async findForMember(userId: string) {
    const where = {
      class: { archivedAt: null, members: { some: { userId } } },
      set: { deletedAt: null },
    };
    // Lấy hết (tối đa MEMBER_ASSIGNMENT_LIMIT) để sắp theo trạng thái rồi mới cắt trang ở service.
    const rows = await this.prisma.assignment.findMany({
      where,
      select: { ...ASSIGNMENT_SELECT, class: { select: { name: true } } },
      orderBy: [{ dueAt: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }, { id: 'asc' }],
      take: MEMBER_ASSIGNMENT_LIMIT,
    });
    const ids = rows.map(({ id }) => id);
    const [submissions, linked] = ids.length
      ? await Promise.all([
          this.prisma.assignmentSubmission.findMany({
            where: { userId, assignmentId: { in: ids } },
            select: { assignmentId: true, late: true },
          }),
          this.prisma.studySession.findMany({
            where: { userId, assignmentId: { in: ids }, finishedAt: { not: null } },
            select: { assignmentId: true, mode: true },
          }),
        ])
      : [[], []];
    const sessions = rows.length
      ? await this.prisma.studySession.findMany({
          where: {
            userId,
            OR: rows.map(({ setId, mode, createdAt }) => ({
              setId,
              mode,
              finishedAt: { gte: createdAt },
            })),
          },
          select: { setId: true, mode: true, finishedAt: true },
          orderBy: { finishedAt: 'asc' },
        })
      : [];
    const items = rows.map(({ class: klass, ...row }) => {
      const finished = sessions.find(
        (session) =>
          session.setId === row.setId &&
          session.mode === row.mode &&
          session.finishedAt !== null &&
          session.finishedAt >= row.createdAt,
      );
      return {
        ...toAssignment(row),
        className: klass.name,
        completedAt: finished?.finishedAt?.toISOString() ?? null,
        submission: submissions.find(({ assignmentId }) => assignmentId === row.id) ?? null,
        doneModes: new Set(
          linked.filter(({ assignmentId }) => assignmentId === row.id).map(({ mode }) => mode),
        ).size,
      };
    });
    return items;
  }

  /** Bài giao của lớp người này đang ở (lớp chưa lưu trữ, bộ chưa xoá). */
  findOneForMember(id: string, userId: string) {
    return this.prisma.assignment.findFirst({
      where: {
        id,
        class: { archivedAt: null, members: { some: { userId } } },
        set: { deletedAt: null },
      },
      select: {
        id: true,
        classId: true,
        setId: true,
        mode: true,
        modes: true,
        dueAt: true,
        createdAt: true,
        set: { select: { title: true } },
        class: { select: { name: true } },
      },
    });
  }

  findFinishedSessions(assignmentId: string, userId: string) {
    return this.prisma.studySession.findMany({
      where: { assignmentId, userId, finishedAt: { not: null } },
      select: { mode: true, correct: true, total: true },
    });
  }

  findSubmission(assignmentId: string, userId: string) {
    return this.prisma.assignmentSubmission.findUnique({
      where: { assignmentId_userId: { assignmentId, userId } },
      select: { submittedAt: true, score: true, late: true },
    });
  }

  /** `null` khi đã có bài nộp (khoá chính trùng), để nộp hai lần cùng lúc không tạo hai bản. */
  async createSubmission(data: {
    assignmentId: string;
    userId: string;
    score: number | null;
    late: boolean;
    submittedAt: Date;
  }) {
    try {
      return await this.prisma.assignmentSubmission.create({
        data,
        select: { submittedAt: true, score: true, late: true },
      });
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  }
}
