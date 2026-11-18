import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_CODES, type ErrorCode } from '@vocab/shared';

/** Lỗi nghiệp vụ. `AllExceptionsFilter` đọc `code`, `message`, `details` để trả về client. */
export class AppError extends HttpException {
  constructor(code: ErrorCode, message: string, status: HttpStatus, details?: unknown) {
    super({ code, message, details }, status);
  }
}

export function forbiddenError(): AppError {
  return new AppError(
    ERROR_CODES.FORBIDDEN,
    'Bạn không có quyền thực hiện thao tác này',
    HttpStatus.FORBIDDEN,
  );
}
