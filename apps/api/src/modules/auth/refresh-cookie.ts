import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieSerializeOptions } from '@fastify/cookie';
import { ERROR_CODES } from '@vocab/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../../common/errors/app-error';
import { parseCorsOrigins, type Env } from '../../config/env';
import type { SessionClient } from './auth-session.service';

export const REFRESH_COOKIE_NAME = 'refresh_token';

/** Trình duyệt chỉ gửi cookie này tới các route auth. */
const REFRESH_COOKIE_PATH = '/api/v1/auth';

export function sessionClientOf(request: FastifyRequest): SessionClient {
  return { userAgent: request.headers['user-agent'], ip: request.ip };
}

@Injectable()
export class RefreshCookie {
  private readonly options: CookieSerializeOptions;
  private readonly trustedOrigins: Set<string>;

  constructor(config: ConfigService<Env, true>) {
    const sameSite = config.get('REFRESH_COOKIE_SAME_SITE', { infer: true });
    const domain = config.get('REFRESH_COOKIE_DOMAIN', { infer: true });
    this.options = {
      httpOnly: true,
      // Trình duyệt từ chối cookie SameSite=None nếu thiếu Secure.
      secure: config.get('NODE_ENV', { infer: true }) === 'production' || sameSite === 'none',
      sameSite,
      path: REFRESH_COOKIE_PATH,
      ...(domain ? { domain } : {}),
    };
    this.trustedOrigins = new Set(parseCorsOrigins(config.get('CORS_ORIGINS', { infer: true })));
  }

  read(request: FastifyRequest): string | undefined {
    return request.cookies[REFRESH_COOKIE_NAME];
  }

  set(reply: FastifyReply, token: string, expires: Date): void {
    void reply.setCookie(REFRESH_COOKIE_NAME, token, { ...this.options, expires });
  }

  clear(reply: FastifyReply): void {
    void reply.clearCookie(REFRESH_COOKIE_NAME, this.options);
  }

  /** Chống CSRF: trình duyệt luôn gửi `Origin` với POST khác nguồn. */
  assertTrustedOrigin({ headers: { origin } }: FastifyRequest): void {
    if (origin !== undefined && !this.trustedOrigins.has(origin)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        'Nguồn gửi yêu cầu không được phép',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
