import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ERROR_CODES,
  type ClassMemberListQuery,
  type JoinClassInput,
  type MemberStats,
  type Pagination,
} from '@vocab/shared';
import { ok, paginated } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import { ClassMembersRepository } from './class-members.repository';

function memberNotFound(): AppError {
  return new AppError(
    ERROR_CODES.CLASS_MEMBER_NOT_FOUND,
    'Người này không ở trong lớp',
    HttpStatus.NOT_FOUND,
  );
}

interface StatsInput {
  assignments: { id: string; dueAt: Date | null }[];
  submissions: { assignmentId: string; userId: string; late: boolean; score: number | null }[];
  lastActive: { userId: string; at: Date | null }[];
}

/**
 * Số liệu một học sinh: bài đã nộp tính đúng hạn hoặc trễ; bài chưa nộp tính bỏ lỡ khi quá hạn,
 * còn lại là đang chờ. Bài hết hạn trước khi em vào lớp không tính, trừ khi em vẫn nộp.
 */
export function memberStats(
  userId: string,
  joinedAt: Date,
  { assignments, submissions, lastActive }: StatsInput,
  now = new Date(),
): MemberStats {
  const mine = new Map(
    submissions.filter((item) => item.userId === userId).map((item) => [item.assignmentId, item]),
  );
  const stats = { onTime: 0, late: 0, missed: 0, pending: 0 };
  const scores: number[] = [];
  for (const { id, dueAt } of assignments) {
    const submission = mine.get(id);
    if (submission) {
      if (submission.late) stats.late += 1;
      else stats.onTime += 1;
      if (submission.score !== null) scores.push(submission.score);
    } else if (dueAt && dueAt < joinedAt) {
      continue;
    } else if (dueAt && dueAt < now) {
      stats.missed += 1;
    } else {
      stats.pending += 1;
    }
  }
  const averageScore = scores.length
    ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
    : null;
  const at = lastActive.find((item) => item.userId === userId)?.at ?? null;
  return { ...stats, averageScore, lastActiveAt: at ? at.toISOString() : null };
}

@Injectable()
export class ClassMembersService {
  constructor(private readonly members: ClassMembersRepository) {}

  async join(userId: string, { joinCode }: JoinClassInput) {
    const found = await this.members.findActiveByJoinCode(joinCode);
    if (!found) {
      throw new AppError(
        ERROR_CODES.CLASS_NOT_FOUND,
        'Mã lớp không đúng hoặc đã được đổi',
        HttpStatus.NOT_FOUND,
      );
    }
    if (found.teacherId === userId) {
      throw new AppError(
        ERROR_CODES.CLASS_TEACHER_CANNOT_JOIN,
        'Bạn đang dạy lớp này nên không cần tham gia',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    return ok(await this.members.join(found.id, userId));
  }

  async listJoined(userId: string, query: Pagination) {
    const { items, total } = await this.members.findJoined(userId, query);
    return paginated(items, total, query);
  }

  async getMember(classId: string, userId: string) {
    const member = await this.members.findMember(classId, userId);
    if (!member) {
      throw memberNotFound();
    }
    const input = await this.members.findStatsInput(classId, [member.userId]);
    return ok({
      ...member,
      stats: memberStats(member.userId, new Date(member.joinedAt), input),
    });
  }

  async listMembers(classId: string, query: ClassMemberListQuery) {
    const { items, total } = await this.members.findMembers(classId, query);
    const input = await this.members.findStatsInput(
      classId,
      items.map(({ userId }) => userId),
    );
    const now = new Date();
    const withStats = items.map((item) => ({
      ...item,
      stats: memberStats(item.userId, new Date(item.joinedAt), input, now),
    }));
    return paginated(withStats, total, query);
  }

  async remove(classId: string, userId: string): Promise<void> {
    if (!(await this.members.remove(classId, userId))) {
      throw memberNotFound();
    }
  }
}
