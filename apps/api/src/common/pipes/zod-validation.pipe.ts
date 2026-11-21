import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ERROR_CODES } from '@vocab/shared';
import type { ZodType } from 'zod';

/** Dùng theo route: `@Body(new ZodValidationPipe(createSetSchema))`. */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Dữ liệu không hợp lệ',
        details: result.error.issues.map(({ path, code, message }) => ({
          path: path.map(String).join('.'),
          code,
          message,
        })),
      });
    }
    return result.data;
  }
}
