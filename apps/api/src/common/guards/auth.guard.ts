import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { AccessTokenService, unauthorizedError } from '../auth/access-token.service';
import { TokenUserRepository } from '../auth/token-user.repository';
import { UserPresenceService } from '../auth/user-presence.service';
import { IS_PUBLIC_KEY, OPTIONAL_AUTH_KEY } from '../decorators/public.decorator';
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
    private readonly presence: UserPresenceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = bearerToken(request);

    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) {
      // Token sai vẫn trả 401, để client refresh thay vì xem trang như khách.
      if (token && this.reflector.getAllAndOverride<boolean>(OPTIONAL_AUTH_KEY, targets)) {
        await this.authenticate(request, token);
      }
      return true;
    }

    if (!token) {
      throw unauthorizedError();
    }
    await this.authenticate(request, token);
    return true;
  }

  private async authenticate(request: FastifyRequest, token: string): Promise<void> {
    const claims = await this.accessTokens.verify(token);
    // Đọc database để tài khoản đã xoá, đã đổi quyền hoặc đã đăng xuất mọi nơi có hiệu lực ngay.
    const user = await this.users.findActiveById(claims.sub);
    if (!user || user.tokenVersion !== claims.tv) {
      throw unauthorizedError();
    }
    this.presence.recordActivity(user.id);
    request.user = { id: user.id, role: user.role };
  }
}
