import { Injectable } from '@nestjs/common';
import type { Pagination } from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { toSkipTake } from '../../common/base/pagination';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const JOINED_SELECT = {
  joinedAt: true,
  class: {
    select: { id: true, name: true, description: true, teacher: { select: { displayName: true } } },
  },
} as const;

interface JoinedRow {
  joinedAt: Date;
  class: { id: string; name: string; description: string | null; teacher: { displayName: string } };
}

function toJoinedClass({ joinedAt, class: { teacher, ...klass } }: JoinedRow) {
  return { ...klass, teacherName: teacher.displayName, joinedAt: joinedAt.toISOString() };
}

@Injectable()
export class ClassMembersRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /** Lớp đã lưu trữ không nhận thêm học sinh, coi như mã không còn. */
  findActiveByJoinCode(joinCode: string) {
    return this.prisma.class.findFirst({
      where: { joinCode, archivedAt: null },
      select: { id: true, teacherId: true },
    });
  }

  /** Tham gia lại không tạo bản ghi trùng và giữ ngày tham gia đầu tiên. */
  async join(classId: string, userId: string) {
    const row = await this.prisma.classMember.upsert({
      where: { classId_userId: { classId, userId } },
      create: { classId, userId },
      update: {},
      select: JOINED_SELECT,
    });
    return toJoinedClass(row);
  }

  async findJoined(userId: string, query: Pagination) {
    const where = { userId, class: { archivedAt: null } };
    const [rows, total] = await Promise.all([
      this.prisma.classMember.findMany({
        where,
        select: JOINED_SELECT,
        orderBy: [{ joinedAt: 'desc' }, { classId: 'asc' }],
        ...toSkipTake(query),
      }),
      this.prisma.classMember.count({ where }),
    ]);
    return { items: rows.map(toJoinedClass), total };
  }

  /** Một học sinh trong lớp, tài khoản đã xoá coi như không còn trong lớp. */
  async findMember(classId: string, userId: string) {
    const row = await this.prisma.classMember.findFirst({
      where: { classId, userId, user: { deletedAt: null } },
      select: { userId: true, joinedAt: true, user: { select: { displayName: true } } },
    });
    return row
      ? {
          userId: row.userId,
          displayName: row.user.displayName,
          joinedAt: row.joinedAt.toISOString(),
        }
      : null;
  }

  async findMembers(classId: string, query: Pagination) {
    const where = { classId, user: { deletedAt: null } };
    const [rows, total] = await Promise.all([
      this.prisma.classMember.findMany({
        where,
        select: { userId: true, joinedAt: true, user: { select: { displayName: true } } },
        orderBy: [{ joinedAt: 'asc' }, { userId: 'asc' }],
        ...toSkipTake(query),
      }),
      this.prisma.classMember.count({ where }),
    ]);
    const items = rows.map(({ userId, joinedAt, user }) => ({
      userId,
      displayName: user.displayName,
      joinedAt: joinedAt.toISOString(),
    }));
    return { items, total };
  }

  /** Trả `false` nếu người này không ở trong lớp. */
  async remove(classId: string, userId: string): Promise<boolean> {
    const { count } = await this.prisma.classMember.deleteMany({ where: { classId, userId } });
    return count > 0;
  }
}
