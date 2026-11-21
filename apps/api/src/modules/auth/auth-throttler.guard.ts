import {
  applyDecorators,
  ExecutionContext,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  SkipThrottle,
  Throttle,
  ThrottlerGuard,
  type ThrottlerLimitDetail,
  type ThrottlerModuleOptions,
  type ThrottlerRequest,
  type ThrottlerStorage,
} from '@nestjs/throttler';
import { emailSchema, ERROR_CODES } from '@vocab/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';
import '../../common/decorators/current-user.decorator';
import { AppError } from '../../common/errors/app-error';
import type { Env } from '../../config/env';

export const ONE_MINUTE_MS = 60_000;
/** Mặc định của `RATE_LIMIT_REGISTER_PER_MINUTE`. */
export const REGISTER_LIMIT_PER_IP = 3;
/** Mặc định của `RATE_LIMIT_REFRESH_PER_MINUTE`. */
export const REFRESH_LIMIT_PER_IP = 60;
const IP_LIMIT_ENV_KEY = 'ipLimitEnv';
type IpLimitEnv = 'RATE_LIMIT_REGISTER_PER_MINUTE' | 'RATE_LIMIT_REFRESH_PER_MINUTE';
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

/** Giới hạn theo IP mỗi phút, đọc từ biến env `env` khi chạy. `fallback` chỉ là giá trị khai báo. */
const IpThrottleFromEnv = (env: IpLimitEnv, fallback: number) =>
  applyDecorators(
    SetMetadata(IP_LIMIT_ENV_KEY, env),
    SkipThrottle({ account: true }),
    Throttle({ ip: { limit: fallback, ttl: ONE_MINUTE_MS } }),
  );

export const RegisterThrottle = () =>
  IpThrottleFromEnv('RATE_LIMIT_REGISTER_PER_MINUTE', REGISTER_LIMIT_PER_IP);

/** Mỗi lần mở trang gọi refresh một lần. */
export const RefreshThrottle = () =>
  IpThrottleFromEnv('RATE_LIMIT_REFRESH_PER_MINUTE', REFRESH_LIMIT_PER_IP);

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storage: ThrottlerStorage,
    reflector: Reflector,
    private readonly config: ConfigService<Env, true>,
  ) {
    super(options, storage, reflector);
  }

  protected override handleRequest(request: ThrottlerRequest): Promise<boolean> {
    const env = this.reflector.get<IpLimitEnv | undefined>(
      IP_LIMIT_ENV_KEY,
      request.context.getHandler(),
    );
    if (env && request.throttler.name === 'ip') {
      return super.handleRequest({ ...request, limit: this.config.get(env, { infer: true }) });
    }
    return super.handleRequest(request);
  }

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
