import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Role } from '@vocab/shared';
import type { FastifyRequest } from 'fastify';
import { unauthorizedError } from '../auth/access-token.service';

export interface CurrentUserData {
  id: string;
  role: Role;
}

declare module 'fastify' {
  interface FastifyRequest {
    /** `AuthGuard` gán sau khi xác thực access token. */
    user?: CurrentUserData;
  }
}

/** Người dùng đã đăng nhập. Chỉ dùng trên route không có `@Public()`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserData => {
    const { user } = context.switchToHttp().getRequest<FastifyRequest>();
    if (!user) {
      throw unauthorizedError();
    }
    return user;
  },
);
