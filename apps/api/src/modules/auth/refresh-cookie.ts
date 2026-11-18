import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieSerializeOptions } from '@fastify/cookie';
import type { FastifyReply } from 'fastify';
import type { Env } from '../../config/env';

export const REFRESH_COOKIE_NAME = 'refresh_token';

/** Trình duyệt chỉ gửi cookie này tới các route auth. */
const REFRESH_COOKIE_PATH = '/api/v1/auth';

@Injectable()
export class RefreshCookie {
  private readonly options: CookieSerializeOptions;

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
  }

  set(reply: FastifyReply, token: string, expires: Date): void {
    void reply.setCookie(REFRESH_COOKIE_NAME, token, { ...this.options, expires });
  }
}
