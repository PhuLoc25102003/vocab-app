import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES, type JoinClassInput, type Pagination } from '@vocab/shared';
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
    return ok(member);
  }

  async listMembers(classId: string, query: Pagination) {
    const { items, total } = await this.members.findMembers(classId, query);
    return paginated(items, total, query);
  }

  async remove(classId: string, userId: string): Promise<void> {
    if (!(await this.members.remove(classId, userId))) {
      throw memberNotFound();
    }
  }
}
