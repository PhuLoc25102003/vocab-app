import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../common/base/base.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class TeacherOverviewRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Lớp đang dạy (chưa lưu trữ) kèm học sinh còn trong lớp, bài giao (bộ chưa xoá) và bài nộp của
   * học sinh hiện còn trong lớp. Tổng quan tính tiếp ở service.
   */
  async findTeacherData(teacherId: string) {
    const classes = await this.prisma.class.findMany({
      where: { teacherId, archivedAt: null },
      select: {
        id: true,
        name: true,
        members: {
          where: { user: { deletedAt: null } },
          select: { userId: true, joinedAt: true, user: { select: { displayName: true } } },
        },
        assignments: {
          where: { set: { deletedAt: null } },
          select: { id: true, dueAt: true, createdAt: true, set: { select: { title: true } } },
        },
      },
    });
    const assignmentIds = classes.flatMap(({ assignments }) => assignments.map(({ id }) => id));
    const submissions = assignmentIds.length
      ? await this.prisma.assignmentSubmission.findMany({
          where: { assignmentId: { in: assignmentIds } },
          select: { assignmentId: true, userId: true, late: true, score: true, submittedAt: true },
        })
      : [];
    return { classes, submissions };
  }
}
