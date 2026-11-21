import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { InjectThrottlerStorage, type ThrottlerStorage } from '@nestjs/throttler';
import { ERROR_CODES } from '@vocab/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { SKIP_API_RATE_LIMIT_KEY } from '../decorators/skip-api-rate-limit.decorator';
import '../decorators/current-user.decorator';
import type { Env } from '../../config/env';
import { AppError } from '../errors/app-error';

const ONE_MINUTE_MS = 60_000;
/** Mặc định của `RATE_LIMIT_USER_PER_MINUTE`. */
export const USER_REQUEST_LIMIT = 100;
/** Mặc định của `RATE_LIMIT_GUEST_PER_MINUTE`. Cao hơn vì nhiều khách có thể dùng chung IP, kể cả server render trang công khai. */
export const GUEST_REQUEST_LIMIT = 300;

/** Chạy sau `AuthGuard` để tính theo người dùng. Bộ đếm dùng chung qua Redis nếu có (`SharedThrottlerStorage`). */
@Injectable()
export class ApiRateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectThrottlerStorage() private readonly storage: ThrottlerStorage,
    private readonly config: ConfigService<Env, true>,
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
      userId
        ? this.config.get('RATE_LIMIT_USER_PER_MINUTE', { infer: true })
        : this.config.get('RATE_LIMIT_GUEST_PER_MINUTE', { infer: true }),
      ONE_MINUTE_MS,
      'api',
    );
    if (!isBlocked) {
      return true;
    }

    request.log.warn({ userId }, 'Chặn vì vượt giới hạn request');
    void http.getResponse<FastifyReply>().header('Retry-After', timeToBlockExpire);
    throw new AppError(
      ERROR_CODES.TOO_MANY_REQUESTS,
      'Bạn thao tác quá nhanh. Hãy đợi một phút rồi thử lại.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
