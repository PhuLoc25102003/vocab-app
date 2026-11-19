import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ERROR_CODES, type ErrorCode } from '@vocab/shared';
import type { FastifyRequest } from 'fastify';
import { unauthorizedError } from '../auth/access-token.service';
import { OwnershipRepository, type OwnedResource } from '../auth/ownership.repository';
import { CHECK_OWNERSHIP_KEY, type OwnershipCheck } from '../decorators/check-ownership.decorator';
import { AppError, forbiddenError } from '../errors/app-error';
import '../decorators/current-user.decorator';

const RESOURCES: Record<
  OwnedResource,
  { adminBypass: boolean; notFoundCode: ErrorCode; notFoundMessage: string }
> = {
  set: {
    adminBypass: true,
    notFoundCode: ERROR_CODES.SET_NOT_FOUND,
    notFoundMessage: 'Không tìm thấy bộ từ',
  },
  // Phiên học chỉ có ý nghĩa với người đang học, kể cả ADMIN cũng không gửi đáp án thay.
  session: {
    adminBypass: false,
    notFoundCode: ERROR_CODES.NOT_FOUND,
    notFoundMessage: 'Không tìm thấy phiên học',
  },
  // Thư mục là cách sắp xếp riêng của mỗi người, ADMIN không cần sửa thay.
  folder: {
    adminBypass: false,
    notFoundCode: ERROR_CODES.FOLDER_NOT_FOUND,
    notFoundMessage: 'Không tìm thấy thư mục',
  },
};

/** Chạy sau `RolesGuard`. Chỉ áp dụng cho route có @CheckOwnership(). */
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly ownership: OwnershipRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const check = this.reflector.getAllAndOverride<OwnershipCheck | undefined>(
      CHECK_OWNERSHIP_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!check) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const { user } = request;
    if (!user) {
      throw unauthorizedError();
    }

    const config = RESOURCES[check.resource];
    if (config.adminBypass && user.role === 'ADMIN') {
      return true;
    }

    const id = (request.params as Record<string, string | undefined>)[check.param];
    const ownerId = id ? await this.ownership.findOwnerId(check.resource, id) : null;
    if (!ownerId) {
      throw new AppError(config.notFoundCode, config.notFoundMessage, HttpStatus.NOT_FOUND);
    }
    if (ownerId !== user.id) {
      throw forbiddenError();
    }
    return true;
  }
}
