import { ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import {
  ThrottlerGuard,
  type ThrottlerLimitDetail,
  type ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { emailSchema, ERROR_CODES } from '@vocab/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';
import '../../common/decorators/current-user.decorator';
import { AppError } from '../../common/errors/app-error';

export const ONE_MINUTE_MS = 60_000;
export const REGISTER_LIMIT_PER_IP = 3;
export const REFRESH_LIMIT_PER_IP = 60;
const ACCOUNT_CHANGE_LIMIT_PER_USER = 5;
const LOGIN_LIMIT_PER_IP = 20;
const LOGIN_LIMIT_PER_ACCOUNT = 5;

/** Guard chạy trước pipe nên body lúc này chưa được validate. */
function ipAndEmail(request: Record<string, unknown>): string {
  const body = request.body as { email?: unknown } | null | undefined;
  const email = emailSchema.safeParse(body?.email);
  return `${String(request.ip)}:${email.success ? email.data : ''}`;
}

/** Sửa tài khoản có thể phải kiểm tra mật khẩu, nên giới hạn theo từng người dùng. */
export const ACCOUNT_THROTTLE = {
  ip: {
    limit: ACCOUNT_CHANGE_LIMIT_PER_USER,
    ttl: ONE_MINUTE_MS,
    getTracker: (request: Record<string, unknown>) =>
      (request as unknown as FastifyRequest).user?.id ?? String(request.ip),
  },
};

/**
 * `account` chặn dò mật khẩu của một email. `ip` giới hạn tổng số lần thử,
 * vì mỗi lần đăng nhập đều tốn một lượt argon2 dù email có tồn tại hay không.
 */
export const AUTH_THROTTLE_OPTIONS: ThrottlerModuleOptions = {
  throttlers: [
    { name: 'ip', ttl: ONE_MINUTE_MS, limit: LOGIN_LIMIT_PER_IP },
    {
      name: 'account',
      ttl: ONE_MINUTE_MS,
      limit: LOGIN_LIMIT_PER_ACCOUNT,
      getTracker: ipAndEmail,
    },
  ],
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
