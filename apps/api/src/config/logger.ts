import type { LoggerService } from '@nestjs/common';
import type { FastifyBaseLogger } from 'fastify';
import type { LoggerOptions } from 'pino';
import type { Env } from './env';

export const REDACTED = '[ẩn]';

/** Tên trường không bao giờ được ghi giá trị ra log, ở bất kỳ cấp nào tới độ sâu 3. */
const SENSITIVE_KEYS = [
  'password',
  'currentPassword',
  'newPassword',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'idToken',
  'credential',
  'authorization',
  'cookie',
  'set-cookie',
];

const REDACT_PATHS = SENSITIVE_KEYS.flatMap((key) => {
  const isIdentifier = /^[A-Za-z_]\w*$/.test(key);
  const child = isIdentifier ? `.${key}` : `["${key}"]`;
  return [...(isIdentifier ? [key] : []), `*${child}`, `*.*${child}`];
});

interface RequestLike {
  id: string;
  method: string;
  url: string;
  ip?: string;
}

/** Cấu hình Pino dùng cho Fastify, log dạng JSON một dòng. */
export function buildLoggerOptions(env: Pick<Env, 'LOG_LEVEL'>): LoggerOptions {
  return {
    level: env.LOG_LEVEL,
    redact: { paths: REDACT_PATHS, censor: REDACTED },
    serializers: {
      // Bỏ query string vì có thể chứa token, chỉ giữ thông tin để tra cứu.
      req: (request: RequestLike) => ({
        id: request.id,
        method: request.method,
        url: request.url.split('?')[0],
        ip: request.ip,
      }),
    },
  };
}

type Level = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

/** Cho log của Nest đi qua cùng logger Pino của Fastify. */
export class PinoLoggerService implements LoggerService {
  constructor(private readonly logger: FastifyBaseLogger) {}

  fatal(message: unknown, ...rest: unknown[]): void {
    this.write('fatal', message, rest);
  }

  error(message: unknown, ...rest: unknown[]): void {
    this.write('error', message, rest);
  }

  warn(message: unknown, ...rest: unknown[]): void {
    this.write('warn', message, rest);
  }

  log(message: unknown, ...rest: unknown[]): void {
    this.write('info', message, rest);
  }

  debug(message: unknown, ...rest: unknown[]): void {
    this.write('debug', message, rest);
  }

  verbose(message: unknown, ...rest: unknown[]): void {
    this.write('trace', message, rest);
  }

  private write(level: Level, message: unknown, rest: unknown[]): void {
    const fields: Record<string, unknown> = {};
    const last = rest.at(-1);
    if (rest.length > 0 && typeof last === 'string') {
      fields.context = last;
      rest = rest.slice(0, -1);
    }
    for (const item of rest) {
      if (item instanceof Error) {
        fields.err = item;
      } else if (typeof item === 'string') {
        fields.stack = item;
      }
    }
    // Object được ghi thành trường riêng để quy tắc ẩn của Pino vẫn áp dụng.
    if (typeof message === 'string') {
      this.logger[level](fields, message);
    } else {
      this.logger[level]({ ...fields, data: message }, '');
    }
  }
}
