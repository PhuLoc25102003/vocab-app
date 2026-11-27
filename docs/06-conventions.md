# Quy ước và quy trình

Nguồn: tách từ `spec-source.md`, đã đối chiếu với code.

Mọi thay đổi đi qua Pull Request, CI phải xanh (lint, typecheck, test, build) mới được merge vào `develop` hoặc `main`; merge vào `main` là tự deploy.

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
- ESLint: `eslint-plugin-boundaries` chặn import sai lớp, cấu hình ở `packages/eslint-config/boundaries.mjs`. Thêm loại thư mục mới thì khai báo tại đây.
- Prettier chạy tự động qua `lint-staged` + Husky trước mỗi commit.
- Comment giải thích **vì sao**, không giải thích code làm gì.
- Cài thư viện vào đúng workspace: `npm i <pkg> -w <workspace>`.

## Đa ngôn ngữ

Giao diện có tiếng Việt (mặc định) và tiếng Anh theo ADR 0003.

- **Không viết cứng chuỗi giao diện.** Chữ người dùng thấy (nhãn, nút, `aria-label`, thông báo, tiêu đề) lấy từ `t()`: client dùng `useTranslation('<namespace>')`, server dùng `await getT('<namespace>')` từ `@/lib/i18n/server`. Nội dung người dùng nhập (bộ từ, thẻ, tên lớp) không dịch.
- Chuỗi nằm ở `apps/web/src/locales/<vi|en>/<namespace>.json`. Thêm khoá thì thêm vào cả hai file; namespace mới thì khai báo thêm ở cả `src/lib/i18n/messages-vi.ts` và `messages-en.ts`. Code chạy ở client không import `lib/i18n/resources.ts` (đủ hai ngôn ngữ, chỉ cho server và test). Test `config.test.ts` báo lỗi khi hai ngôn ngữ lệch khoá, TypeScript báo lỗi khi gõ sai khoá.
- Ngày giờ và số dùng `Intl` với `INTL_LOCALE[locale]`.
- Ngôn ngữ lưu trong cookie `vocab.locale`. Root layout đọc cookie trong `Suspense` vì repo bật `cacheComponents`.
- Màn hình cũ chưa dịch sẽ được chuyển dần ở các việc 6.2 đến 6.6; việc 6.7 thêm script báo chữ tiếng Việt viết cứng.

## Git workflow

- Flow: issue → nhánh từ `develop` → commit → PR vào `develop` → review → squash merge. Phát hành bằng PR từ `develop` vào `main`. Chi tiết trong skill `git-workflow`.
- Nhánh: `main` (production), `develop` (tích hợp), `<type>/<số-issue>-<mô-tả>`, ví dụ `feat/12-dictation-mode`. Type gồm `feat`, `fix`, `refactor`, `docs`, `test`, `chore`. Không push thẳng `main` hay `develop`.
- Commit theo Conventional Commits: `feat(study): add dictation mode`, `fix(auth): handle refresh race`.
- PR nhỏ (dưới ~400 dòng), mô tả gồm: làm gì, vì sao, cách test, ảnh chụp nếu đổi UI.
- PR vào `develop` dùng squash merge. PR phát hành từ `develop` vào `main` dùng merge commit để hai nhánh giữ chung lịch sử.
- Hotfix tách từ `main`, merge vào `main`, rồi đưa ngược về `develop`.
- Quyết định kiến trúc quan trọng ghi thành ADR ngắn trong `docs/adr/NNNN-ten.md`.

## Testing

| Loại        | Công cụ                           | Test cái gì                                                                     | Mục tiêu                               |
| ----------- | --------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------- |
| Unit        | Vitest                            | `packages/shared`: chấm điểm, SRS, parser import; service BE với repository giả | ≥ 90% cho `shared`, ≥ 70% cho service  |
| Component   | Vitest + Testing Library          | Các chế độ học, form tạo bộ từ, bảng xem trước import                           | Mỗi mode có test đúng / sai            |
| Integration | Supertest + Postgres trong Docker | Endpoint thật: auth, phân quyền, CRUD                                           | Mọi endpoint có ít nhất 1 test 401/403 |
| E2E         | Playwright                        | Đăng ký → import → học → xem kết quả                                            | 3–5 luồng chính                        |

Cách chạy:

- `npm test` chạy test của `shared`, `api` và `web`. Test của API cần Postgres, chạy `npm run db:up` trước.
- Test của `shared` và `web` đặt cạnh code (`*.test.ts`, `*.test.tsx`). Test của API đặt trong `apps/api/test` để không lọt vào bản build, integration test đặt tên `*.integration.test.ts`.
- Integration test dùng database `<tên>_test`, lấy từ `DATABASE_URL`. Database này được tạo tự động và áp dụng migration trước khi chạy. Dữ liệu dev không bị đụng tới.
- Dùng `createTestApp()` và `resetDatabase()` trong `apps/api/test/support`.

## CI/CD

`.github/workflows/ci.yml` chạy job `Verify` trên mọi PR và push vào `develop`, `main`: `npm ci` → `npm audit --omit=dev --audit-level=high` → `prisma migrate deploy` trên Postgres service container → `lint` → `typecheck` → `test` → `build`. Các bước chạy tuần tự vì `typecheck` và `build` của API đều sinh lại Prisma Client. Integration test chạy trên database `vocab_test` trong cùng Postgres service.

Audit chỉ chặn lỗ hổng từ mức cao trong dependency production. Công cụ phát triển không đi vào bản chạy thật, nên `@vocab/eslint-config` khai báo dependency ở `devDependencies`.

Dependabot mở PR vào `develop` mỗi tuần cho npm và GitHub Actions. Bản major của TypeScript, ESLint, NestJS và `@types/node` được bỏ qua vì cần nâng có kế hoạch: `typescript-eslint` giới hạn TypeScript, một số plugin chưa hỗ trợ ESLint 10, NestJS 12 chỉ hỗ trợ ESM, `@types/node` đi theo Node 24.

Đặt `Verify` làm required status check trong branch protection của `main` và `develop` để chặn merge khi CI đỏ.

| Thành phần | Preview (mỗi PR)                    | Production (merge `main`)                            |
| ---------- | ----------------------------------- | ---------------------------------------------------- |
| Web        | Vercel preview URL tự động          | Vercel production                                    |
| API        | Không bắt buộc giai đoạn đầu        | Render/Railway tự deploy khi `main` đổi              |
| Database   | Neon branch riêng cho PR (tuỳ chọn) | `prisma migrate deploy` chạy trước khi khởi động API |

Migration chỉ "thêm" an toàn (thêm cột cho phép null, thêm bảng); đổi tên hay xoá cột làm hai lần deploy để không làm sập bản đang chạy.

## Biến môi trường

| Biến                                                                     | Nơi dùng                            | Ghi chú                                                                                                                         |
| ------------------------------------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                           | API                                 | Chuỗi kết nối (local Docker / Neon có pooling)                                                                                  |
| `DIRECT_URL`                                                             | API                                 | Kết nối trực tiếp tới Neon cho migration. Để trống thì dùng `DATABASE_URL`                                                      |
| `PORT`, `NODE_ENV`                                                       | API                                 | Mặc định `4000`, `development`                                                                                                  |
| `POSTGRES_PORT`                                                          | `docker-compose.yml` (`.env` ở gốc) | Cổng host của Postgres, mặc định `5432`                                                                                         |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`                                | API                                 | Hai chuỗi ngẫu nhiên khác nhau, ≥ 32 byte                                                                                       |
| `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`                                      | API                                 | `15m`, `30d`                                                                                                                    |
| `CORS_ORIGINS`                                                           | API                                 | Domain FE, phân cách bằng dấu phẩy                                                                                              |
| `TRUSTED_PROXIES`                                                        | API                                 | IP hoặc CIDR của proxy trước API, hoặc số tầng proxy (ví dụ `2` khi đi qua Vercel rồi Render). Local để trống                   |
| `REFRESH_COOKIE_SAME_SITE`, `REFRESH_COOKIE_DOMAIN`                      | API                                 | Thuộc tính cookie refresh, mặc định `lax` và không đặt domain                                                                   |
| `GOOGLE_CLIENT_ID`                                                       | API                                 | Client ID để kiểm tra Google ID token. Để trống thì tắt đăng nhập Google                                                        |
| `LOG_LEVEL`                                                              | API                                 | Mức log của Pino, mặc định `info`. Đặt `silent` để tắt                                                                          |
| `RATE_LIMIT_USER_PER_MINUTE`, `RATE_LIMIT_GUEST_PER_MINUTE`              | API                                 | Số request mỗi phút, mặc định 100 cho người dùng và 300 cho mỗi IP khách. E2E đặt cao hơn                                       |
| `RATE_LIMIT_REGISTER_PER_MINUTE`, `RATE_LIMIT_REFRESH_PER_MINUTE`        | API                                 | Số lần đăng ký và gọi `/auth/refresh` mỗi phút cho một IP, mặc định 3 và 60. E2E đặt cao hơn                                    |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | API                                 | Chưa dùng. Lưu ảnh, âm thanh                                                                                                    |
| `SENTRY_DSN`                                                             | API + Web                           | Chưa dùng. Giám sát lỗi                                                                                                         |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`                                           | Web                                 | Trùng `GOOGLE_CLIENT_ID`. Để trống thì ẩn nút Google                                                                            |
| `NEXT_PUBLIC_API_URL`                                                    | Web                                 | URL backend; tiền tố `NEXT_PUBLIC_` nghĩa là lộ ra trình duyệt, không để secret ở đây                                           |
| `API_INTERNAL_URL`                                                       | Web                                 | Địa chỉ API mà server của web gọi và chuyển tiếp `/api/v1` tới. Chỉ đặt khi web và API không chung tên miền, xem `08-deploy.md` |

Khi deploy đăng nhập Google: thêm địa chỉ web `https` vào **Authorized JavaScript origins** của Google OAuth Client, đặt hai biến Client ID trên API và web rồi deploy lại, sau đó bấm **Publish app** trong mục Audience. Google không nhận origin có dấu `*`, nên link preview phải thêm từng cái nếu cần.

Có file `.env.example` (không có giá trị thật) ở gốc và trong mỗi app. Biến mới phải được thêm vào đó, biến của API còn phải khai báo trong `apps/api/src/config/env.ts`.

## Hiệu năng và giám sát

- Render free ngủ khi không có truy cập: FE hiển thị skeleton và gọi `/health` ngay khi mở trang để đánh thức sớm.
- Gửi đáp án theo lô (10 câu hoặc khi kết thúc) thay vì mỗi câu một request.
- Trang bộ từ công khai dùng `use cache` + `cacheLife` của Next.js, làm mới sau 5 phút. Bộ từ vừa chuyển riêng tư hoặc bị xoá có thể còn hiện trên trang này tối đa 5 phút.
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
- [ ] Đánh dấu việc trong `docs/07-progress.md` (chỉ dòng của việc; bảng tổng quan chạy `npm run progress` trong PR đồng bộ riêng)

## Hiện trạng công cụ

| Có                                                                                                                                                                                                                                               | Chưa có        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| TypeScript strict, ESLint dùng chung, Prettier, `lint` và `typecheck` qua Turbo, `.env.example` cho từng app, CI bằng GitHub Actions, Vitest, Testing Library, Supertest, Playwright, Husky, lint-staged, `eslint-plugin-boundaries`, Dependabot | `constants.ts` |

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
- Migration dùng `DIRECT_URL` nếu có, nếu không thì `DATABASE_URL` (`apps/api/prisma.config.ts`). Cách deploy xem `08-deploy.md`.
- ISR đổi từ `revalidate` sang `use cache` + `cacheLife`, vì app bật Cache Components và Next.js báo lỗi nếu route còn export `revalidate`.
- Thêm mục hiện trạng công cụ.
