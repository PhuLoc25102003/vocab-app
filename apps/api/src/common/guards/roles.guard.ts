import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@vocab/shared';
import type { FastifyRequest } from 'fastify';
import { unauthorizedError } from '../auth/access-token.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { forbiddenError } from '../errors/app-error';
import '../decorators/current-user.decorator';

/** Chạy sau `AuthGuard`. Route không có @Roles() không bị giới hạn theo vai trò. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<FastifyRequest>();
    if (!user) {
      throw unauthorizedError();
    }
    if (!roles.includes(user.role)) {
      throw forbiddenError();
    }
    return true;
  }
}
