import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '@vocab/shared';

/** Lỗi nghiệp vụ. `AllExceptionsFilter` đọc `code`, `message`, `details` để trả về client. */
export class AppError extends HttpException {
  constructor(code: ErrorCode, message: string, status: HttpStatus, details?: unknown) {
    super({ code, message, details }, status);
  }
}
