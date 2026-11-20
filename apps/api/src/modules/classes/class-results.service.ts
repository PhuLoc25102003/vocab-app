import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ERROR_CODES,
  type Assignment,
  type AssignmentStatus,
  type Pagination,
} from '@vocab/shared';
import { ok, paginated } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import { AssignmentsRepository } from './assignments.repository';
import { assignmentStatus } from './assignments.service';
import {
  ClassResultsRepository,
  type AssignmentTarget,
  type FinishedSession,
} from './class-results.repository';

interface Score {
  status: AssignmentStatus;
  completedAt: string | null;
  correct: number | null;
  total: number | null;
}

const ratio = ({ correct, total }: FinishedSession) => (total > 0 ? correct / total : 0);

const belongsTo = (session: FinishedSession, target: AssignmentTarget) =>
  session.setId === target.setId &&
  session.mode === target.mode &&
  session.finishedAt >= target.createdAt;

/**
 * Hoàn thành tính theo lần học xong đầu tiên, điểm lấy lần tốt nhất.
 * `sessions` đã xếp theo thời gian học xong, cũ trước.
 */
function scoreFor(
  sessions: readonly FinishedSession[],
  target: AssignmentTarget,
  now: Date,
): Score {
  const mine = sessions.filter((session) => belongsTo(session, target));
  const [first] = mine;
  const best = mine.reduce<FinishedSession | undefined>(
    (top, session) => (!top || ratio(session) > ratio(top) ? session : top),
    undefined,
  );
  const completedAt = first?.finishedAt.toISOString() ?? null;
  return {
    status: assignmentStatus(completedAt, target.dueAt?.toISOString() ?? null, now),
    completedAt,
    correct: best?.correct ?? null,
    total: best?.total ?? null,
  };
}

const toTarget = ({
  setId,
  mode,
  dueAt,
  createdAt,
}: Pick<Assignment, 'setId' | 'mode' | 'dueAt' | 'createdAt'>): AssignmentTarget => ({
  setId,
  mode,
  dueAt: dueAt ? new Date(dueAt) : null,
  createdAt: new Date(createdAt),
});

const percent = ({ correct, total }: Score) => (total ? ((correct ?? 0) / total) * 100 : 0);

@Injectable()
export class ClassResultsService {
  constructor(
    private readonly results: ClassResultsRepository,
    private readonly assignments: AssignmentsRepository,
  ) {}

  private async target(classId: string, assignmentId: string): Promise<AssignmentTarget> {
    const target = await this.results.findAssignment(classId, assignmentId);
    if (!target) {
      throw new AppError(
        ERROR_CODES.ASSIGNMENT_NOT_FOUND,
        'Không tìm thấy bài giao',
        HttpStatus.NOT_FOUND,
      );
    }
    return target;
  }

  /** Số liệu cả lớp của một bài giao, chỉ tính học sinh hiện còn trong lớp. */
  async summary(classId: string, assignmentId: string, now = new Date()) {
    const target = await this.target(classId, assignmentId);
    const { items: members } = await this.results.findMembers(classId);
    const [sessions, hardCards] = await Promise.all([
      this.results.findFinishedSessions(
        members.map(({ userId }) => userId),
        [target],
      ),
      this.results.findHardCards(classId, target),
    ]);
    const scores = members.map(({ userId }) =>
      scoreFor(
        sessions.filter((session) => session.userId === userId),
        target,
        now,
      ),
    );
    const done = scores.filter(({ status }) => status === 'done');
    const averageScore = done.length
      ? Math.round((done.reduce((sum, score) => sum + percent(score), 0) / done.length) * 10) / 10
      : null;
    return ok({
      memberCount: members.length,
      doneCount: done.length,
      overdueCount: scores.filter(({ status }) => status === 'overdue').length,
      averageScore,
      hardCards,
    });
  }

  /** Kết quả từng học sinh của một bài giao, theo thứ tự vào lớp. */
  async assignmentResults(
    classId: string,
    assignmentId: string,
    query: Pagination,
    now = new Date(),
  ) {
    const target = await this.target(classId, assignmentId);
    const { items: members, total } = await this.results.findMembers(classId, query);
    const sessions = await this.results.findFinishedSessions(
      members.map(({ userId }) => userId),
      [target],
    );
    const data = members.map((member) => ({
      ...member,
      ...scoreFor(
        sessions.filter((session) => session.userId === member.userId),
        target,
        now,
      ),
    }));
    return paginated(data, total, query);
  }

  /** Kết quả của một học sinh qua các bài giao của lớp, hạn gần nhất trước. */
  async memberResults(classId: string, userId: string, query: Pagination, now = new Date()) {
    if (!(await this.results.isMember(classId, userId))) {
      throw new AppError(
        ERROR_CODES.CLASS_MEMBER_NOT_FOUND,
        'Học sinh không ở trong lớp',
        HttpStatus.NOT_FOUND,
      );
    }
    const { items, total } = await this.assignments.findByClass(classId, query);
    const targets = items.map(toTarget);
    const sessions = await this.results.findFinishedSessions([userId], targets);
    const data = items.map((item, index) => ({
      ...item,
      ...scoreFor(sessions, targets[index] ?? toTarget(item), now),
    }));
    return paginated(data, total, query);
  }
}
