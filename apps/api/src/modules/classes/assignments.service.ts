import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ERROR_CODES,
  type AssignmentModeProgress,
  type AssignmentStatus,
  type CreateAssignmentDto,
  type Pagination,
  type ProgressStatus,
  type StudyMode,
  type Submission,
} from '@vocab/shared';
import { ok, paginated } from '../../common/base/pagination';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { AppError } from '../../common/errors/app-error';
import { AssignmentsRepository } from './assignments.repository';

@Injectable()
export class AssignmentsService {
  constructor(private readonly assignments: AssignmentsRepository) {}

  /**
   * Giáo viên chỉ giao bộ của mình, ADMIN giao được mọi bộ. Bộ riêng tư thì học sinh không
   * xem được, nên phải đổi sang Lớp học hoặc Công khai trước.
   */
  async create(classId: string, user: CurrentUserData, dto: CreateAssignmentDto) {
    const set = await this.assignments.findSet(dto.setId);
    if (!set || (user.role !== 'ADMIN' && set.ownerId !== user.id)) {
      throw new AppError(ERROR_CODES.SET_NOT_FOUND, 'Không tìm thấy bộ từ', HttpStatus.NOT_FOUND, [
        { path: 'setId', code: 'not_found', message: 'Không tìm thấy bộ từ của bạn' },
      ]);
    }
    const shareSet = set.visibility === 'PRIVATE';
    if (shareSet && !dto.shareToClass) {
      throw new AppError(
        ERROR_CODES.SET_NOT_SHAREABLE,
        'Bộ từ đang riêng tư. Đồng ý cho học sinh trong lớp xem bộ này để giao.',
        HttpStatus.UNPROCESSABLE_ENTITY,
        [{ path: 'shareToClass', code: 'private', message: 'Bộ từ đang riêng tư' }],
      );
    }
    if (dto.modes.includes('MATCH') && set.cardCount < 2) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Ghép cặp cần bộ có ít nhất 2 thẻ',
        HttpStatus.UNPROCESSABLE_ENTITY,
        [{ path: 'modes', code: 'too_few_cards', message: 'Ghép cặp cần ít nhất 2 thẻ' }],
      );
    }
    const assignment = await this.assignments.create({
      classId,
      setId: dto.setId,
      modes: dto.modes,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      shareSet,
    });
    return ok(assignment);
  }

  async list(classId: string, query: Pagination) {
    const { items, total } = await this.assignments.findByClass(classId, query);
    return paginated(items, total, query);
  }

  async remove(classId: string, id: string): Promise<void> {
    if (!(await this.assignments.delete(classId, id))) {
      throw new AppError(
        ERROR_CODES.ASSIGNMENT_NOT_FOUND,
        'Không tìm thấy bài giao',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /** Đã học xong là `done` kể cả khi nộp trễ; quá hạn mà chưa học là `overdue`. */
  private async memberDetail(id: string, userId: string) {
    const row = await this.assignments.findOneForMember(id, userId);
    if (!row) {
      throw new AppError(
        ERROR_CODES.ASSIGNMENT_NOT_FOUND,
        'Không tìm thấy bài giao',
        HttpStatus.NOT_FOUND,
      );
    }
    const [sessions, submission] = await Promise.all([
      this.assignments.findFinishedSessions(id, userId),
      this.assignments.findSubmission(id, userId),
    ]);
    const modes = row.modes.length ? row.modes : [row.mode];
    const progress = modeProgress(modes, sessions);
    return { row, modes, progress, submission };
  }

  async getForMember(id: string, userId: string) {
    const { row, modes, progress, submission } = await this.memberDetail(id, userId);
    return ok({
      id: row.id,
      classId: row.classId,
      className: row.class.name,
      setId: row.setId,
      setTitle: row.set.title,
      modes,
      dueAt: row.dueAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      progress,
      submission: submission ? toSubmission(submission) : null,
      canSubmit: !submission && progress.every(({ done }) => done),
    });
  }

  /** Nộp một lần khi đã xong mọi chế độ; nộp sau hạn vẫn nhận và đánh dấu trễ. */
  async submit(id: string, userId: string, now = new Date()) {
    const { row, progress, submission } = await this.memberDetail(id, userId);
    const alreadySubmitted = () =>
      new AppError(
        ERROR_CODES.ASSIGNMENT_ALREADY_SUBMITTED,
        'Bạn đã nộp bài này',
        HttpStatus.CONFLICT,
      );
    if (submission) throw alreadySubmitted();
    if (!progress.every(({ done }) => done)) {
      throw new AppError(
        ERROR_CODES.ASSIGNMENT_INCOMPLETE,
        'Hãy làm xong mọi chế độ của bài rồi nộp',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const created = await this.assignments.createSubmission({
      assignmentId: id,
      userId,
      score: assignmentScore(progress),
      late: row.dueAt !== null && now > row.dueAt,
      submittedAt: now,
    });
    if (!created) throw alreadySubmitted();
    return ok(toSubmission(created));
  }

  /** Bỏ lỡ lên đầu, rồi bài chưa nộp theo hạn gần nhất, bài đã nộp xuống cuối. */
  async listForMember(userId: string, query: Pagination, now = new Date()) {
    const items = await this.assignments.findForMember(userId);
    const rank: Record<ProgressStatus, number> = {
      missed: 0,
      in_progress: 1,
      todo: 1,
      late: 2,
      submitted: 2,
    };
    const withStatus = items
      .map(({ submission, ...item }) => {
        const modes = item.modes.length ? item.modes : [item.mode];
        return {
          ...item,
          modes,
          status: assignmentStatus(item.completedAt, item.dueAt, now),
          progressStatus: progressStatus(submission, item.doneModes, item.dueAt, now),
        };
      })
      .map((item, index) => ({ item, index }))
      .sort(
        (a, b) => rank[a.item.progressStatus] - rank[b.item.progressStatus] || a.index - b.index,
      )
      .map(({ item }) => item);
    const start = (query.page - 1) * query.limit;
    return paginated(withStatus.slice(start, start + query.limit), withStatus.length, query);
  }
}

type FinishedSession = { mode: StudyMode; correct: number; total: number };

/** Tiến độ từng chế độ theo thứ tự của bài: điểm là phiên tốt nhất, Flashcard không chấm điểm. */
export function modeProgress(
  modes: StudyMode[],
  sessions: FinishedSession[],
): AssignmentModeProgress[] {
  return modes.map((mode) => {
    const done = sessions.filter((session) => session.mode === mode);
    const scores = done
      .filter(({ total }) => total > 0)
      .map(({ correct, total }) => Math.round((correct * 100) / total));
    return {
      mode,
      done: done.length > 0,
      score: mode === 'FLASHCARD' || scores.length === 0 ? null : Math.max(...scores),
    };
  });
}

/** Điểm bài là trung bình các chế độ có chấm điểm, `null` khi không có chế độ nào chấm điểm. */
export function assignmentScore(progress: AssignmentModeProgress[]): number | null {
  const graded = progress.flatMap(({ score }) => (score === null ? [] : [score]));
  return graded.length
    ? Math.round(graded.reduce((sum, score) => sum + score, 0) / graded.length)
    : null;
}

export function progressStatus(
  submission: { late: boolean } | null,
  doneModes: number,
  dueAt: string | null,
  now: Date,
): ProgressStatus {
  if (submission) return submission.late ? 'late' : 'submitted';
  if (dueAt && new Date(dueAt) < now) return 'missed';
  return doneModes > 0 ? 'in_progress' : 'todo';
}

export function assignmentStatus(
  completedAt: string | null,
  dueAt: string | null,
  now: Date,
): AssignmentStatus {
  if (completedAt) return 'done';
  if (dueAt && new Date(dueAt) < now) return 'overdue';
  return 'pending';
}

function toSubmission({
  submittedAt,
  score,
  late,
}: {
  submittedAt: Date;
  score: number | null;
  late: boolean;
}): Submission {
  return { submittedAt: submittedAt.toISOString(), score, late };
}
