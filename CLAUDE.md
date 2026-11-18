# vocab-app

Web ôn từ vựng bằng flashcard và nhiều chế độ luyện tập cho học sinh Việt Nam.
Monorepo npm workspaces + Turborepo gồm Next.js 16, NestJS 11 + Fastify, Prisma 7 và PostgreSQL.

## Lệnh thường dùng

Chỉ dùng npm. Chạy ở gốc repo, dùng Node 24 (`.nvmrc`, `nvm use 24.22.3`).

```bash
npm run dev          # web :3000, api :4000, shared watch
npm run build
npm test             # chưa có package nào khai báo test
npm run lint
npm run typecheck
npm run format

npm run db:up        # docker compose up -d
npm run db:down      # docker compose down
npm run prisma:migrate -w @vocab/api -- --name ten_migration
npm run prisma:generate -w @vocab/api
npm run prisma:deploy -w @vocab/api   # áp dụng migration, không tạo migration mới
npm run build -w @vocab/shared
npm i <pkg> -w <workspace>
```

Nếu cổng 5432 đã bận, đặt `POSTGRES_PORT` trong `.env` ở gốc và sửa `DATABASE_URL` trong `apps/api/.env`.

## Bản đồ thư mục

```text
apps/web/src
  app/                 Routing, layout: (marketing), (auth), (app)
  features/<tên>/      api.ts, hooks/, components/, store: auth, sets, import, study, stats
  components/ui/       Thành phần cơ bản
  components/common/   Thành phần dùng chung
  lib/                 http.ts, query-client.ts, speech.ts
apps/api
  prisma/              schema.prisma, migrations
  src/config/          Kiểm tra env bằng Zod
  src/common/          guards, decorators, pipes, filters, interceptors, base
  src/infrastructure/  prisma, storage
  src/modules/         auth, users, sets, cards, import, study, progress, health
  src/generated/       Prisma Client sinh tự động, không sửa, không commit
packages/shared/src    Zod schema, type, mã lỗi, logic học dùng chung
packages/eslint-config ESLint dùng chung
docs/                  Tài liệu kỹ thuật và ADR
.claude/skills/        Quy trình làm việc của dự án
```

Dự án mới có khung. Trước khi dùng một thành phần được nhắc trong docs, xem mục Hiện trạng ở `docs/01-code-structure.md`.

## Quy tắc bắt buộc

1. Backend đi theo Controller → Service → Repository. Chỉ repository được gọi Prisma, service không dùng `req` hay `res`.
2. Zod schema và type dùng chung đặt ở `@vocab/shared`, không khai báo lại trong app. Sửa xong phải build lại shared.
3. Input API đi qua `ZodValidationPipe` với schema từ shared. Form dùng lại schema đó qua `zodResolver`.
4. Mọi route cần đăng nhập, trừ route có `@Public()`. Không nới lỏng `AuthGuard` để làm cho nhanh.
5. Kiểm tra vai trò bằng `@Roles` và quyền sở hữu bằng `@CheckOwnership` cùng guard. Không viết lại `if (ownerId !== userId)` trong service.
6. Lỗi nghiệp vụ dùng `AppError` với mã trong `packages/shared/src/errors.ts`. Lỗi trả về dạng `{ error: { code, message, details, requestId } }`.
7. Danh sách nhận `page`, `limit`, `sort`, trả `{ data, meta }`, `limit` tối đa 100.
8. Frontend gọi API qua `features/*/api.ts` → `lib/http.ts`. Component không gọi `fetch`, `app/` không chứa logic.
9. Chỉ dùng design token trong `docs/05-ui-tokens.md`. Cấm mã hex và class màu mặc định của Tailwind trong `.tsx`.
10. Màn hình có dữ liệu phải đủ 4 trạng thái: loading, empty, error, success.
11. UI chạy đúng ở light, dark, 360 px, dùng được bằng bàn phím, vùng bấm tối thiểu 44 px, tôn trọng `prefers-reduced-motion`.
12. TypeScript strict, không dùng `any`. Dùng `unknown` rồi thu hẹp kiểu.
13. Thay đổi database theo kiểu "thêm". Đổi tên hoặc xoá cột chia hai lần deploy.
14. Không commit `.env`. Biến mới phải có trong `.env.example`, biến của API phải có trong `apps/api/src/config/env.ts`.
15. Commit theo Conventional Commits. Đổi API, database hoặc token thì cập nhật `docs/` cùng commit, xong một việc thì đánh dấu trong `docs/07-progress.md`.

## Khi làm việc gì

| Khi làm                             | Đọc                                             | Dùng skill     |
| ----------------------------------- | ----------------------------------------------- | -------------- |
| Tính năng trọn vẹn FE + BE          | `docs/00-overview.md`, `01`, `03`, `04`         | `new-feature`  |
| Thêm hoặc sửa endpoint              | `docs/03-api.md`, `docs/04-security.md`         | `api-endpoint` |
| Thêm chế độ học                     | `docs/00-overview.md`, `docs/05-ui-tokens.md`   | `study-mode`   |
| Component, trang, form, style       | `docs/05-ui-tokens.md`                          | `ui-component` |
| Đổi Prisma schema                   | `docs/02-database.md`                           | `db-migration` |
| Auth, phân quyền, dữ liệu nhạy cảm  | `docs/04-security.md`                           | `api-endpoint` |
| Đặt tên, test, Git, CI, env         | `docs/06-conventions.md`                        | Không có       |
| Sắp xếp thư mục, tái sử dụng code   | `docs/01-code-structure.md`                     | Không có       |
| Quyết định kiến trúc mới            | `docs/adr/`, thêm ADR `NNNN-ten.md`             | Không có       |
| Xem tiến độ, chọn việc tiếp theo    | `docs/07-progress.md`                           | `git-workflow` |
| Tạo issue, nhánh, commit, PR, merge | `docs/06-conventions.md`                        | `git-workflow` |
| Trước khi commit hoặc mở PR         | `docs/06-conventions.md`, `docs/04-security.md` | `code-review`  |
