import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { AccessTokenService, unauthorizedError } from '../auth/access-token.service';
import { TokenUserRepository } from '../auth/token-user.repository';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import '../decorators/current-user.decorator';

function bearerToken({ headers }: FastifyRequest): string | null {
  const [scheme, token, ...rest] = (headers.authorization ?? '').split(' ');
  return scheme?.toLowerCase() === 'bearer' && token && rest.length === 0 ? token : null;
}

/** Guard toàn cục: mọi route cần access token hợp lệ, trừ route có @Public(). */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokens: AccessTokenService,
    private readonly users: TokenUserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = bearerToken(request);
    if (!token) {
      throw unauthorizedError();
    }

    const claims = await this.accessTokens.verify(token);
    // Đọc database để tài khoản đã xoá, đã đổi quyền hoặc đã đăng xuất mọi nơi có hiệu lực ngay.
    const user = await this.users.findActiveById(claims.sub);
    if (!user || user.tokenVersion !== claims.tv) {
      throw unauthorizedError();
    }

    request.user = { id: user.id, role: user.role };
    return true;
  }
}
