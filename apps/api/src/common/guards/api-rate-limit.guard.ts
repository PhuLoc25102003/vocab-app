import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectThrottlerStorage, type ThrottlerStorage } from '@nestjs/throttler';
import { ERROR_CODES } from '@vocab/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { SKIP_API_RATE_LIMIT_KEY } from '../decorators/skip-api-rate-limit.decorator';
import '../decorators/current-user.decorator';
import { AppError } from '../errors/app-error';

const ONE_MINUTE_MS = 60_000;
export const USER_REQUEST_LIMIT = 100;
/** Cao hơn vì nhiều khách có thể dùng chung IP, kể cả server render trang công khai. */
export const GUEST_REQUEST_LIMIT = 300;

/** Chạy sau `AuthGuard` để tính theo người dùng. Bộ đếm nằm trong bộ nhớ của instance. */
@Injectable()
export class ApiRateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectThrottlerStorage() private readonly storage: ThrottlerStorage,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipped = this.reflector.getAllAndOverride<boolean>(SKIP_API_RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipped) {
      return true;
    }

    const http = context.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const userId = request.user?.id;
    const { isBlocked, timeToBlockExpire } = await this.storage.increment(
      userId ? `api:user:${userId}` : `api:ip:${request.ip}`,
      ONE_MINUTE_MS,
      userId ? USER_REQUEST_LIMIT : GUEST_REQUEST_LIMIT,
      ONE_MINUTE_MS,
      'api',
    );
    if (!isBlocked) {
      return true;
    }

    void http.getResponse<FastifyReply>().header('Retry-After', timeToBlockExpire);
    throw new AppError(
      ERROR_CODES.TOO_MANY_REQUESTS,
      'Bạn thao tác quá nhanh. Hãy đợi một phút rồi thử lại.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
