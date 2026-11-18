# Cấu trúc code

Nguồn: tách từ `spec-source.md`, đã đối chiếu với code. Cây thư mục dưới đây là đích đến, phần đã có xem mục "Hiện trạng".

Một monorepo gồm 2 app và các package dùng chung; code chia theo tính năng (feature-based), không chia theo loại file.

## Monorepo

```text
vocab-app/
├── apps/
│   ├── web/                 # Next.js → Vercel
│   └── api/                 # NestJS → Render / Railway
├── packages/
│   ├── shared/              # Zod schema, types, hằng số, SRS, chấm điểm, study strategies
│   └── eslint-config/       # ESLint dùng chung
├── docs/                    # tài liệu, ADR
├── .github/workflows/       # CI
├── docker-compose.yml       # Postgres local
├── tsconfig.base.json       # TypeScript dùng chung
├── .prettierrc.json         # Prettier dùng chung
├── turbo.json
└── package.json             # "workspaces": ["apps/*", "packages/*"]
```

Quy tắc phụ thuộc: `apps/*` được import `packages/*`; `packages/*` không bao giờ import `apps/*`; `shared` không phụ thuộc React hay NestJS.

## Frontend – apps/web

```text
src/
├── app/                          # chỉ routing + layout, rất mỏng
│   ├── (marketing)/page.tsx      # landing
│   ├── (auth)/login, register
│   ├── (public)/public/sets/[id]/page.tsx  # trang công khai cho khách
│   ├── (public)/public/sets/[id]/study/[mode]/page.tsx  # khách học thử, không lưu tiến độ
│   ├── (app)/dashboard
│   ├── (app)/explore             # tìm bộ từ công khai
│   ├── (app)/sets/[id]/page.tsx
│   ├── (app)/sets/[id]/study/[mode]/page.tsx
│   └── (app)/sets/new, import
├── features/                     # mỗi tính năng tự chứa
│   ├── auth/        { api.ts, hooks/, components/, store.ts }
│   ├── sets/        { api.ts, hooks/use-sets.ts, components/set-card.tsx ... }
│   ├── import/      { parsers/, components/import-preview.tsx }
│   ├── study/
│   │   ├── modes/   { flashcard/, write/, dictation/, mcq/, match/ }
│   │   ├── session.store.ts      # Zustand: thẻ hiện tại, điểm, hàng đợi
│   │   └── components/study-shell.tsx
│   └── stats/
├── components/ui/                # shadcn/ui đã áp token (Button, Input, Dialog...)
├── components/common/            # app-nav, page-header, empty-state, error-state, loading-state, audio-button
├── lib/
│   ├── http.ts                   # một HTTP client duy nhất, tự refresh token
│   ├── query-client.ts
│   └── speech.ts                 # bọc Web Speech API
└── proxy.ts                      # chặn route (app) khi chưa đăng nhập
```

Quy tắc frontend:

- `app/` không chứa logic; page chỉ gọi component của `features/`.
- Mọi gọi API đi qua `features/*/api.ts` → `lib/http.ts`; component không gọi `fetch` trực tiếp.
- Query key đặt trong một factory (`setKeys.detail(id)`) để invalidate đúng chỗ.
- Component nhận props, không tự đọc store toàn cục, trừ component cấp trang.
- Không hard-code màu hay cỡ chữ: chỉ dùng class Tailwind sinh từ token (xem `05-ui-tokens.md`).
- Mỗi chế độ học là một component cùng props `{ question, onAnswer }`, được `StudyShell` chọn theo `mode`.

## Backend – apps/api

```text
src/
├── main.ts                         # bootstrap, helmet, CORS, global pipes/filters
├── app.module.ts
├── config/                         # đọc env, validate bằng Zod khi khởi động
├── common/
│   ├── guards/       auth.guard.ts, roles.guard.ts, ownership.guard.ts
│   ├── decorators/   @Public(), @Roles(), @CurrentUser()
│   ├── pipes/        zod-validation.pipe.ts
│   ├── filters/      all-exceptions.filter.ts   # chuẩn hoá lỗi trả về
│   ├── errors/       app-error.ts
│   ├── interceptors/ request-id.interceptor.ts
│   └── base/         base.repository.ts, pagination.ts
├── infrastructure/
│   ├── prisma/       prisma.service.ts
│   ├── storage/      storage.interface.ts, r2.storage.ts
│   ├── tts/          tts.interface.ts, web-tts.provider.ts
│   └── mail/
├── generated/prisma/               # Prisma Client sinh ra (gitignore)
└── modules/
    ├── auth/         controller, service, strategies/, dto/
    ├── users/
    ├── sets/         sets.controller.ts, sets.service.ts, sets.repository.ts, dto/
    ├── cards/
    ├── import/       import.service.ts, parsers/ (text, csv, xlsx)
    ├── study/        controller, service, repository (SRS nằm ở shared)
    ├── progress/
    ├── health/
    └── classes/      (giai đoạn 3)
```

Luồng trong một module: **Controller → Service → Repository → Prisma**. Controller không gọi Prisma; Service không biết HTTP (không dùng `req`, `res`).

## Tái sử dụng, không lặp code

| Thứ hay bị lặp                     | Đặt ở đâu                                        | Dùng thế nào                                                                   |
| ---------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| Validate dữ liệu                   | `packages/shared/src/schemas`                    | `ZodValidationPipe(createSetSchema)` ở BE, `zodResolver(createSetSchema)` ở FE |
| Phân trang, sắp xếp                | `common/base/pagination.ts` + `paginationSchema` | Mọi API danh sách nhận `?page&limit&sort` giống nhau                           |
| Truy cập Prisma                    | `BaseRepository`                                 | Repository cụ thể kế thừa, chỉ viết query đặc thù                              |
| Kiểm tra quyền sở hữu              | `OwnershipGuard` + `@CheckOwnership('set')`      | Không viết lại `if (set.ownerId !== user.id)` trong từng service               |
| Định dạng lỗi                      | `AllExceptionsFilter` + `AppError`               | Mọi lỗi trả về cùng một dạng JSON                                              |
| Chấm điểm, so sánh đáp án          | `packages/shared/src/study/grading.ts`           | FE chấm ngay để phản hồi nhanh, BE chấm lại khi lưu tiến độ                    |
| Trạng thái loading / empty / error | `components/common`                              | Mọi trang dùng chung, cùng giọng văn                                           |

## Hiện trạng

| Thành phần trong tài liệu                                                                         | Hiện trạng                                                           |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `common/guards/auth.guard.ts`                                                                     | Có. Xác thực JWT, từ chối route không có `@Public()` nếu thiếu token |
| `@Public()`, `ZodValidationPipe`, `AllExceptionsFilter`, `RequestIdInterceptor`, `BaseRepository` | Có                                                                   |
| `@Roles()`, `@CurrentUser()`, `@CheckOwnership()`, `RolesGuard`, `OwnershipGuard`                 | Có                                                                   |
| `AppError`, `packages/shared/src/errors.ts`                                                       | Có                                                                   |
| `paginationSchema`, `common/base/pagination.ts`                                                   | Có                                                                   |
| `packages/shared/src/study`                                                                       | Có type, registry, chấm điểm, SRS và strategy của 4 chế độ MVP       |
| shadcn/ui, `AppNav`, `PageHeader`, `EmptyState`, `ErrorState`, `LoadingState`                     | Có                                                                   |
| `apps/web/src/proxy.ts`                                                                           | Có. Điều hướng theo cookie đánh dấu `vocab_session`                  |
| `AudioButton`                                                                                     | Có, dùng Web Speech API                                              |
| Module nghiệp vụ trong `apps/api/src/modules`                                                     | `health`, `auth`, `users`, `sets`, `study` có code, còn lại rỗng     |

## Đã điều chỉnh so với spec gốc

- `packages/config` đổi thành `packages/eslint-config`. Cấu hình TypeScript và Prettier nằm ở gốc repo (`tsconfig.base.json`, `.prettierrc.json`).
- Bỏ `packages/ui-tokens`, token nằm trong `apps/web/src/app/globals.css`.
- Mã nguồn shared nằm dưới `packages/shared/src`.
- `middleware.ts` đổi thành `proxy.ts` theo Next.js 16.
- `jwt-auth.guard.ts` đổi thành `auth.guard.ts`, đúng tên file trong code.
- Tên file component dùng kebab-case, khớp code và shadcn/ui (xem `06-conventions.md`).
- `BaseRepository` hiện không generic và chỉ giữ `prisma`.
- Thêm `common/errors/app-error.ts` làm nơi đặt `AppError`.
