# Quy ước và quy trình

Nguồn: tách từ `spec-source.md`, đã đối chiếu với code.

Mọi thay đổi đi qua Pull Request, CI phải xanh (lint, typecheck, test, build) mới được merge vào `main`; merge vào `main` là tự deploy.

## Quy ước đặt tên

| Loại                 | Quy ước                               | Ví dụ                                          |
| -------------------- | ------------------------------------- | ---------------------------------------------- |
| File component React | kebab-case                            | `set-card.tsx`, `flashcard-mode.tsx`           |
| File khác (FE)       | kebab-case                            | `use-sets.ts`, `query-client.ts`               |
| File NestJS          | kebab-case + hậu tố vai trò           | `sets.service.ts`, `roles.guard.ts`            |
| Biến, hàm            | camelCase, hàm bắt đầu bằng động từ   | `getDueCards`, `isCorrect`                     |
| Hook                 | `use` + danh từ, file kebab-case      | `useStudySession` trong `use-study-session.ts` |
| Interface            | Tiền tố `I` cho interface inject (BE) | `ICardRepository`                              |
| Zod schema           | camelCase + `Schema`                  | `createSetSchema`                              |
| Hằng số, mã lỗi      | UPPER_SNAKE                           | `MAX_CARDS_PER_SET`, `SET_NOT_FOUND`           |
| Bảng / model Prisma  | PascalCase số ít                      | `StudySet`, `CardProgress`                     |
| Endpoint             | danh từ số nhiều, kebab-case          | `/study/sessions`, `/review/due`               |

## Quy tắc viết code

- TypeScript `strict: true`; cấm `any` (dùng `unknown` rồi thu hẹp kiểu).
- Hàm ≤ 40 dòng, file ≤ 300 dòng; vượt thì tách.
- Không "số ma": đưa vào `packages/shared/src/constants.ts`.
- Import theo alias (`@/features/sets`, `@vocab/shared`), không dùng `../../../`.
- ESLint: `eslint-plugin-boundaries` chặn import sai lớp.
- Prettier chạy tự động qua `lint-staged` + Husky trước mỗi commit.
- Comment giải thích **vì sao**, không giải thích code làm gì.
- Cài thư viện vào đúng workspace: `npm i <pkg> -w <workspace>`.

## Git workflow

- Nhánh: `main` (production), `feat/<tên>`, `fix/<tên>`, `chore/<tên>`. Không push thẳng `main`.
- Commit theo Conventional Commits: `feat(study): add dictation mode`, `fix(auth): handle refresh race`.
- PR nhỏ (dưới ~400 dòng), mô tả gồm: làm gì, vì sao, cách test, ảnh chụp nếu đổi UI.
- Squash merge để lịch sử `main` gọn.
- Quyết định kiến trúc quan trọng ghi thành ADR ngắn trong `docs/adr/NNNN-ten.md`.

## Testing

| Loại        | Công cụ                           | Test cái gì                                                                     | Mục tiêu                               |
| ----------- | --------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------- |
| Unit        | Vitest                            | `packages/shared`: chấm điểm, SRS, parser import; service BE với repository giả | ≥ 90% cho `shared`, ≥ 70% cho service  |
| Component   | Vitest + Testing Library          | Các chế độ học, form tạo bộ từ, bảng xem trước import                           | Mỗi mode có test đúng / sai            |
| Integration | Supertest + Postgres trong Docker | Endpoint thật: auth, phân quyền, CRUD                                           | Mọi endpoint có ít nhất 1 test 401/403 |
| E2E         | Playwright                        | Đăng ký → import → học → xem kết quả                                            | 3–5 luồng chính                        |

## CI/CD

GitHub Actions, mỗi PR chạy: `npm ci` → `npx turbo lint typecheck test build` (chỉ chạy phần bị ảnh hưởng) → integration test với Postgres service container.

| Thành phần | Preview (mỗi PR)                    | Production (merge `main`)                            |
| ---------- | ----------------------------------- | ---------------------------------------------------- |
| Web        | Vercel preview URL tự động          | Vercel production                                    |
| API        | Không bắt buộc giai đoạn đầu        | Render/Railway tự deploy khi `main` đổi              |
| Database   | Neon branch riêng cho PR (tuỳ chọn) | `prisma migrate deploy` chạy trước khi khởi động API |

Migration chỉ "thêm" an toàn (thêm cột cho phép null, thêm bảng); đổi tên hay xoá cột làm hai lần deploy để không làm sập bản đang chạy.

## Biến môi trường

| Biến                                                                     | Nơi dùng                            | Ghi chú                                                                               |
| ------------------------------------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                           | API                                 | Chuỗi kết nối (local Docker / Neon có pooling)                                        |
| `DIRECT_URL`                                                             | API                                 | Chưa dùng. Kết nối trực tiếp cho migration khi lên Neon                               |
| `PORT`, `NODE_ENV`                                                       | API                                 | Mặc định `4000`, `development`                                                        |
| `POSTGRES_PORT`                                                          | `docker-compose.yml` (`.env` ở gốc) | Cổng host của Postgres, mặc định `5432`                                               |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`                                | API                                 | Hai chuỗi ngẫu nhiên khác nhau, ≥ 32 byte                                             |
| `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`                                      | API                                 | `15m`, `30d`                                                                          |
| `CORS_ORIGINS`                                                           | API                                 | Domain FE, phân cách bằng dấu phẩy                                                    |
| `GOOGLE_CLIENT_ID`                                                       | API + Web                           | Chưa dùng. Đăng nhập Google                                                           |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | API                                 | Chưa dùng. Lưu ảnh, âm thanh                                                          |
| `SENTRY_DSN`                                                             | API + Web                           | Chưa dùng. Giám sát lỗi                                                               |
| `NEXT_PUBLIC_API_URL`                                                    | Web                                 | URL backend; tiền tố `NEXT_PUBLIC_` nghĩa là lộ ra trình duyệt, không để secret ở đây |

Có file `.env.example` (không có giá trị thật) ở gốc và trong mỗi app. Biến mới phải được thêm vào đó, biến của API còn phải khai báo trong `apps/api/src/config/env.ts`.

## Hiệu năng và giám sát

- Render free ngủ khi không có truy cập: FE hiển thị skeleton và gọi `/health` ngay khi mở trang để đánh thức sớm.
- Gửi đáp án theo lô (10 câu hoặc khi kết thúc) thay vì mỗi câu một request.
- Trang bộ từ công khai dùng `use cache` + `cacheLife` của Next.js, làm mới sau 5 phút.
- Tránh N+1: dùng `include` / `select` của Prisma, bật log query chậm (> 200 ms).
- Endpoint `/health` kiểm tra kết nối DB; theo dõi bằng UptimeRobot hoặc Sentry Uptime.
- Mỗi request có `requestId`, ghi trong log và trả về trong lỗi để tra cứu.
- Lighthouse: Performance ≥ 90, Accessibility ≥ 95 trên trang học.

## Definition of Done cho mỗi tính năng

- [ ] Schema Zod ở `shared`, dùng cho cả FE và BE
- [ ] Endpoint có guard phân quyền và test 401/403
- [ ] UI có đủ 4 trạng thái: loading, empty, error, thành công
- [ ] Chỉ dùng design token, chạy đúng ở light và dark
- [ ] Dùng được bằng bàn phím, vòng focus thấy rõ
- [ ] Hiển thị tốt ở màn hình 360 px
- [ ] Test unit/integration xanh trong CI
- [ ] Cập nhật Swagger và `docs/` nếu đổi API, database hoặc token

## Hiện trạng công cụ

| Có                                                                                                           | Chưa có                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript strict, ESLint dùng chung, Prettier, `lint` và `typecheck` qua Turbo, `.env.example` cho từng app | Vitest, Testing Library, Supertest, Playwright test, Husky, lint-staged, `eslint-plugin-boundaries`, GitHub Actions, `constants.ts` |

Chưa có package nào khai báo script `test`, nên `npm test` hiện không chạy test nào. Nhánh hiện tại của repo là `master`, cần đổi hoặc tạo `main` trước khi bật quy trình PR.

## Lệnh Prisma

Tên migration phải truyền qua workspace `@vocab/api`:

```bash
npm run prisma:migrate -w @vocab/api -- --name ten_migration
npm run prisma:generate -w @vocab/api
```

## Đã điều chỉnh so với spec gốc

- Tên file component đổi từ PascalCase sang kebab-case, khớp code và shadcn/ui.
- `packages/shared/constants.ts` đổi thành `packages/shared/src/constants.ts`.
- Bảng biến môi trường bổ sung `PORT`, `NODE_ENV`, `POSTGRES_PORT` và ghi rõ biến nào chưa dùng.
- `DIRECT_URL` chưa được dùng. Migration lấy `DATABASE_URL` trong `prisma.config.ts`, khi dùng Neon cần cập nhật file này.
- ISR đổi từ `revalidate` sang `use cache` + `cacheLife`, vì app bật Cache Components và Next.js báo lỗi nếu route còn export `revalidate`.
- Thêm mục hiện trạng công cụ.
