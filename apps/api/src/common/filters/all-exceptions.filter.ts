import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { ERROR_CODES, type ApiError, type ErrorCode } from '@vocab/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';

const CODE_BY_STATUS: Record<number, ErrorCode> = {
  400: ERROR_CODES.BAD_REQUEST,
  401: ERROR_CODES.UNAUTHORIZED,
  403: ERROR_CODES.FORBIDDEN,
  404: ERROR_CODES.NOT_FOUND,
  405: ERROR_CODES.METHOD_NOT_ALLOWED,
  409: ERROR_CODES.CONFLICT,
  413: ERROR_CODES.PAYLOAD_TOO_LARGE,
  415: ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
  422: ERROR_CODES.UNPROCESSABLE_ENTITY,
  429: ERROR_CODES.TOO_MANY_REQUESTS,
  503: ERROR_CODES.SERVICE_UNAVAILABLE,
};

interface NormalizedError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

function codeForStatus(status: number): ErrorCode {
  return (
    CODE_BY_STATUS[status] ??
    (status >= 500 ? ERROR_CODES.INTERNAL_ERROR : ERROR_CODES.REQUEST_ERROR)
  );
}

function normalize(exception: unknown): NormalizedError {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const response = exception.getResponse();
    const body = typeof response === 'object' ? (response as Record<string, unknown>) : {};
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    return {
      status,
      code: typeof body.code === 'string' ? body.code : codeForStatus(status),
      message: typeof message === 'string' ? message : exception.message,
      details: body.details,
    };
  }

  // Lỗi 4xx do Fastify ném ra, ví dụ JSON sai cú pháp hoặc body quá lớn.
  const candidate = exception as { statusCode?: unknown; message?: unknown } | null;
  const status = candidate?.statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return {
      status,
      code: codeForStatus(status),
      message: typeof candidate?.message === 'string' ? candidate.message : 'Yêu cầu không hợp lệ',
    };
  }

  return { status: 500, code: ERROR_CODES.INTERNAL_ERROR, message: 'Đã có lỗi xảy ra' };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const reply = http.getResponse<FastifyReply>();
    const { status, code, message, details } = normalize(exception);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} [${request.id}]`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiError = {
      error: { code, message, details: details ?? null, requestId: request.id },
    };
    void reply.status(status).header('x-request-id', request.id).send(body);
  }
}
