import { ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import {
  ThrottlerGuard,
  type ThrottlerLimitDetail,
  type ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { ERROR_CODES } from '@vocab/shared';
import type { FastifyReply } from 'fastify';
import { AppError } from '../../common/errors/app-error';

const ONE_MINUTE_MS = 60_000;
const REGISTER_LIMIT_PER_IP = 3;

export const AUTH_THROTTLE_OPTIONS: ThrottlerModuleOptions = {
  throttlers: [{ name: 'ip', ttl: ONE_MINUTE_MS, limit: REGISTER_LIMIT_PER_IP }],
};

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected override throwThrottlingException(
    context: ExecutionContext,
    { timeToBlockExpire }: ThrottlerLimitDetail,
  ): Promise<void> {
    void context
      .switchToHttp()
      .getResponse<FastifyReply>()
      .header('Retry-After', timeToBlockExpire);
    throw new AppError(
      ERROR_CODES.TOO_MANY_REQUESTS,
      'Bạn đã thử quá nhiều lần. Hãy đợi một phút rồi thử lại.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
