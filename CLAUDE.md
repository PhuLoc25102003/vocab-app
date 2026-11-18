# vocab-app

Web ôn từ vựng kiểu flashcard cho học sinh. Monorepo npm workspaces + Turborepo. Chỉ dùng npm.

## Cấu trúc

```text
apps/web          Next.js (App Router), Tailwind v4, cổng 3000
  src/app         Route groups: (marketing), (auth), (app)
  src/features    auth, sets, import, study, stats
  src/components  ui (thành phần cơ bản), common (dùng chung)
  src/lib         http.ts, query-client.ts, speech.ts
apps/api          NestJS + Fastify, prefix /api/v1, cổng 4000
  prisma          schema.prisma, migrations
  src/config      Kiểm tra env bằng Zod khi khởi động
  src/common      guards, decorators, pipes, filters, interceptors, base
  src/infrastructure  prisma, storage
  src/modules     auth, users, sets, cards, import, study, progress, health
  src/generated   Prisma client sinh tự động, không sửa, không commit
packages/shared   @vocab/shared: Zod schema và type dùng chung
packages/eslint-config  Cấu hình ESLint dùng chung
```

## Lệnh

```bash
npm run db:up       # Bật Postgres bằng Docker
npm run dev         # Chạy web, api và shared ở chế độ watch
npm run build
npm run typecheck
npm run lint
npm run format
npm run db:migrate -- --name ten_migration
```

## Quy tắc backend

- Luồng bắt buộc: Controller → Service → Repository.
  - Controller chỉ nhận request và trả response.
  - Service chứa nghiệp vụ.
  - Repository kế thừa `BaseRepository` và là nơi duy nhất gọi Prisma.
- Mọi route mặc định cần đăng nhập. `AuthGuard` toàn cục từ chối mọi route không có `@Public()`.
  Bước xác thực JWT chưa được làm, nên hiện chỉ route `@Public()` truy cập được.
- Validate đầu vào bằng `ZodValidationPipe` với schema từ `@vocab/shared`.
- Lỗi luôn có dạng `{ error: { code, message, details, requestId } }`, do `AllExceptionsFilter` xử lý.
  Khi ném `HttpException`, truyền `{ code, message, details }` để có mã lỗi cụ thể.
- Env mới phải được khai báo trong `apps/api/src/config/env.ts` và `.env.example`.

## Quy tắc frontend

- Chỉ dùng design token trong `apps/web/src/app/globals.css`.
- Cấm mã hex và class màu mặc định của Tailwind (như `bg-blue-500`, `text-white`) trong `.tsx`.
  Dùng class theo vai trò: `bg-surface`, `text-text-muted`, `bg-primary`, `text-primary-fg`...
- Dark mode bằng class `.dark` trên `<html>`.
- Font: `font-sans` (Be Vietnam Pro) cho toàn app, `font-card` (Lexend) cho chữ trên flashcard.
- Chuyển động dùng `duration-fast`, `duration-base`, `duration-flip`. Các token này về 0 khi người
  dùng bật `prefers-reduced-motion`.

## Quy tắc chung

- Schema Zod và type dùng chung đặt ở `packages/shared`, không khai báo lại trong app.
  Sau khi sửa, `@vocab/shared` phải được build lại (`npm run dev` tự làm việc này).
- TypeScript strict, không dùng `any` nếu tránh được.
- Commit theo Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`.
- Không commit `.env`. Biến mới phải được thêm vào `.env.example` tương ứng.
