import { ApiBody } from '@nestjs/swagger';
import { z, type ZodType } from 'zod';

type ApiBodySchema = Extract<Parameters<typeof ApiBody>[0], { schema: unknown }>['schema'];

/** Mô tả body trong Swagger từ chính schema dùng để validate. */
export function ApiZodBody(schema: ZodType): MethodDecorator {
  const body = z.toJSONSchema(schema, { io: 'input' });
  delete body.$schema;
  return ApiBody({ schema: body as ApiBodySchema });
}
