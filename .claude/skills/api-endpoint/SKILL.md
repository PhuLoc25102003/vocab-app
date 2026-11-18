---
name: api-endpoint
description: Dùng khi thêm hoặc sửa một endpoint REST trong apps/api của vocab-app, gồm validate, phân quyền, mã lỗi, phân trang, Swagger và test. Nếu cần cả giao diện, dùng new-feature.
---

# Thêm hoặc sửa endpoint

Đọc trước: `docs/03-api.md`, `docs/04-security.md`. Không đổi ngầm hợp đồng `/api/v1`. Thay đổi phá vỡ tương thích phải đi qua `/api/v2`.

## Điều kiện nền

Các phần sau có thể chưa tồn tại. Kiểm tra trước, thiếu thì tạo theo mẫu và giữ nguyên tên.

`packages/shared/src/errors.ts`, export từ `index.ts`:

```ts
export const ERROR_CODES = {
  SET_NOT_FOUND: 'SET_NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
} as const;
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
```

`apps/api/src/common/errors/app-error.ts`. `AllExceptionsFilter` đã đọc sẵn `code`, `message`, `details`:

```ts
import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '@vocab/shared';

export class AppError extends HttpException {
  constructor(code: ErrorCode, message: string, status: HttpStatus, details?: unknown) {
    super({ code, message, details }, status);
  }
}
```

`packages/shared/src/schemas/pagination.ts`, export từ `index.ts`:

```ts
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().max(50).default('-updatedAt'),
});
export type Pagination = z.infer<typeof paginationSchema>;
```

`apps/api/src/common/base/pagination.ts`:

```ts
import type { Pagination } from '@vocab/shared';

export const ok = <T>(data: T) => ({ data });

export const paginated = <T>(data: T[], total: number, { page, limit }: Pagination) => ({
  data,
  meta: { page, limit, total },
});

export const toSkipTake = ({ page, limit }: Pagination) => ({
  skip: (page - 1) * limit,
  take: limit,
});
```

`sort` phải được đối chiếu với danh sách trường cho phép trong repository. Không đưa thẳng vào `orderBy`.

`@Roles()`, `RolesGuard`, `@CheckOwnership()`, `OwnershipGuard`, `@CurrentUser()` thuộc phần auth, đặt trong `common/decorators` và `common/guards`. Nếu chưa có, làm chúng trước theo `docs/04-security.md`.

Swagger chưa cài: `npm i @nestjs/swagger@^11 @fastify/static -w @vocab/api`, cấu hình trong `main.ts`, chỉ bật ngoài production tại `/api/docs`. Kiểm tra trang này còn chạy với Content-Security-Policy của helmet.

## Các bước

1. Định nghĩa hoặc dùng lại schema trong `packages/shared/src/schemas`, rồi `npm run build -w @vocab/shared`.
2. Thêm mã lỗi vào `errors.ts` nếu cần.
3. Viết repository, service, controller.
4. Chọn đúng một mức truy cập:

| Ai được gọi      | Khai báo                              |
| ---------------- | ------------------------------------- |
| Ai cũng gọi được | `@Public()`                           |
| Đã đăng nhập     | Không thêm gì, `AuthGuard` đã áp dụng |
| Theo vai trò     | `@Roles('TEACHER', 'ADMIN')`          |
| Chủ tài nguyên   | `@CheckOwnership('set')`              |

5. Thêm Swagger decorator và test.
6. Cập nhật bảng endpoint trong `docs/03-api.md`.

## Mẫu

```ts
@ApiTags('sets')
@ApiBearerAuth()
@Controller('sets')
export class SetsController {
  constructor(private readonly sets: SetsService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Tìm bộ từ công khai' })
  findPublic(@Query(new ZodValidationPipe(paginationSchema)) query: Pagination) {
    return this.sets.findPublic(query);
  }

  @Patch(':id')
  @CheckOwnership('set')
  @ApiOperation({ summary: 'Sửa thông tin bộ từ' })
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateSetSchema)) dto: UpdateSetDto) {
    return this.sets.update(id, dto);
  }
}
```

```ts
@Injectable()
export class SetsService {
  constructor(private readonly repository: SetsRepository) {}

  async findPublic(query: Pagination) {
    const [items, total] = await this.repository.findPublic(query);
    return paginated(items, total, query);
  }

  async update(id: string, dto: UpdateSetDto) {
    const set = await this.repository.update(id, dto);
    if (!set) {
      throw new AppError(ERROR_CODES.SET_NOT_FOUND, 'Không tìm thấy bộ từ', HttpStatus.NOT_FOUND);
    }
    return ok(set);
  }
}
```

```ts
@Injectable()
export class SetsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findPublic(query: Pagination) {
    const where = { visibility: 'PUBLIC', deletedAt: null } as const;
    return Promise.all([
      this.prisma.studySet.findMany({
        where,
        ...toSkipTake(query),
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.studySet.count({ where }),
    ]);
  }
}
```

## Test

Lần đầu cần cài: `npm i -D vitest supertest @types/supertest unplugin-swc @swc/core -w @vocab/api`, thêm script `"test": "vitest run"`. Cần SWC vì esbuild không sinh metadata cho decorator của NestJS. Dùng database test riêng, không chạy trên dữ liệu dev.

```ts
const app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
app.setGlobalPrefix('api/v1');
await app.init();
await app.getHttpAdapter().getInstance().ready();

await request(app.getHttpServer()).patch(`/api/v1/sets/${id}`).send({ title: 'A' }).expect(401);
```

## Checklist cuối

- [ ] Body, query và param có input tự do đều qua `ZodValidationPipe` với schema từ shared
- [ ] `@Public`, `@Roles`, `@CheckOwnership` đúng mức truy cập
- [ ] Query không tin `id` một mình, có `ownerId` hoặc qua `OwnershipGuard`
- [ ] Lỗi nghiệp vụ dùng `AppError` với mã trong `errors.ts`
- [ ] Danh sách dùng `paginationSchema`, trả `{ data, meta }`, `limit` tối đa 100
- [ ] Có Swagger decorator
- [ ] Test có 401, 403 khi áp dụng, 400 và trường hợp thành công
- [ ] `docs/03-api.md` đã cập nhật
