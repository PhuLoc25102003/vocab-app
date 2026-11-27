import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ERROR_CODES } from '@vocab/shared';
import type { FastifyRequest } from 'fastify';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Env } from '../../config/env';
import { AppError } from '../errors/app-error';

export const JOB_SECRET_HEADER = 'x-job-secret';

const digest = (value: string) => createHash('sha256').update(value).digest();

/**
 * Cho `POST /internal/jobs/*`: route là `@Public()` vì GitHub Actions không có tài khoản, nên
 * guard này đòi header `X-Job-Secret` khớp `JOBS_SECRET`. So sánh băm để không lộ độ dài và chống
 * đo thời gian. Chưa cấu hình khoá thì trả 404 như route không tồn tại.
 */
@Injectable()
export class JobSecretGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get('JOBS_SECRET', { infer: true });
    if (!secret) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Không tìm thấy', HttpStatus.NOT_FOUND);
    }
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const given = request.headers[JOB_SECRET_HEADER];
    if (typeof given !== 'string' || !timingSafeEqual(digest(given), digest(secret))) {
      throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Sai khoá job', HttpStatus.UNAUTHORIZED);
    }
    return true;
  }
}
