import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ERROR_CODES,
  type AssignmentStatus,
  type CreateAssignmentDto,
  type Pagination,
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
  async listForMember(userId: string, query: Pagination, now = new Date()) {
    const { items, total } = await this.assignments.findForMember(userId, query);
    const withStatus = items.map((item) => ({
      ...item,
      status: assignmentStatus(item.completedAt, item.dueAt, now),
    }));
    return paginated(withStatus, total, query);
  }
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
