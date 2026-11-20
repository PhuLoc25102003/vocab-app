import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES, type CreateAssignmentInput, type Pagination } from '@vocab/shared';
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
  async create(classId: string, user: CurrentUserData, dto: CreateAssignmentInput) {
    const set = await this.assignments.findSet(dto.setId);
    if (!set || (user.role !== 'ADMIN' && set.ownerId !== user.id)) {
      throw new AppError(ERROR_CODES.SET_NOT_FOUND, 'Không tìm thấy bộ từ', HttpStatus.NOT_FOUND, [
        { path: 'setId', code: 'not_found', message: 'Không tìm thấy bộ từ của bạn' },
      ]);
    }
    if (set.visibility === 'PRIVATE') {
      throw new AppError(
        ERROR_CODES.SET_NOT_SHAREABLE,
        'Bộ từ đang riêng tư. Hãy đổi sang Lớp học hoặc Công khai rồi giao lại.',
        HttpStatus.UNPROCESSABLE_ENTITY,
        [{ path: 'setId', code: 'private', message: 'Bộ từ đang riêng tư' }],
      );
    }
    const assignment = await this.assignments.create({
      classId,
      setId: dto.setId,
      mode: dto.mode,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
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
}
