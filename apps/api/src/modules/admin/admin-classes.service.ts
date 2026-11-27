import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@vocab/shared';
import { ok } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import { AdminClassesRepository } from './admin-classes.repository';

@Injectable()
export class AdminClassesService {
  constructor(private readonly repository: AdminClassesRepository) {}

  async getOverview() {
    const overview = await this.repository.getClassesOverview();
    return ok(overview);
  }

  /**
   * Xếp học sinh vào lớp như khi học sinh nhập mã: lớp phải còn hoạt động, tài khoản phải là học sinh.
   * Đã ở trong lớp thì giữ nguyên ngày tham gia và báo `alreadyMember`.
   */
  async assignStudent(classId: string, userId: string) {
    const klass = await this.repository.findClass(classId);
    if (!klass) {
      throw new AppError(ERROR_CODES.CLASS_NOT_FOUND, 'Không tìm thấy lớp', HttpStatus.NOT_FOUND);
    }
    if (klass.archivedAt) {
      throw new AppError(
        ERROR_CODES.CLASS_ARCHIVED,
        'Lớp đã lưu trữ nên không thêm học sinh được',
        HttpStatus.CONFLICT,
      );
    }
    const user = await this.repository.findUser(userId);
    if (!user) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'Không tìm thấy người dùng',
        HttpStatus.NOT_FOUND,
      );
    }
    if (user.role !== 'STUDENT') {
      throw new AppError(
        ERROR_CODES.USER_NOT_STUDENT,
        'Chỉ xếp lớp được cho tài khoản học sinh',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const { joinedAt, created } = await this.repository.addMember(classId, userId);
    return ok({
      classId,
      className: klass.name,
      userId,
      displayName: user.displayName,
      joinedAt: joinedAt.toISOString(),
      alreadyMember: !created,
    });
  }
}
