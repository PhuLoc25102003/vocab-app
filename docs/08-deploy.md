# Deploy

Web chạy trên Vercel, API trên Render, database trên Neon. Tài liệu này dùng địa chỉ miễn phí `*.vercel.app` và `*.onrender.com`, chưa cần tên miền riêng.

## Vì sao web chuyển tiếp API

`vercel.app` và `onrender.com` là hai trang khác nhau, nên cookie refresh của API là cookie bên thứ ba và Safari chặn nó. Web vì vậy chuyển tiếp `/api/v1/*` sang API (`rewrites` trong `apps/web/next.config.ts`). Trình duyệt chỉ thấy một địa chỉ, cookie refresh là cookie cùng trang với `SameSite=Lax`.

Khi có tên miền chung, ví dụ `app.` và `api.` cùng một tên miền, có thể bỏ chuyển tiếp: đặt `NEXT_PUBLIC_API_URL` là địa chỉ API, để trống `API_INTERNAL_URL`, đặt `REFRESH_COOKIE_DOMAIN`.

## Neon

1. Tạo project ở region Singapore. Postgres 17 hoặc 18 đều chạy được.
2. Nút **Connect**, mục Postgres database: bật Connection pooling để lấy `DATABASE_URL` (tên máy có `-pooler`), tắt để lấy `DIRECT_URL`.
3. Migration dùng `DIRECT_URL` (`apps/api/prisma.config.ts`), app dùng `DATABASE_URL`.
4. Lộ mật khẩu thì vào **Roles**, **Reset password**, rồi cập nhật hai biến trên Render.

## Render (API)

| Mục               | Giá trị                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------- |
| Runtime, region   | Node, Singapore                                                                         |
| Build command     | `npm ci --include=dev && npm run build -w @vocab/shared && npm run build -w @vocab/api` |
| Start command     | `npm run prisma:deploy -w @vocab/api && npm run start -w @vocab/api`                    |
| Health check path | `/api/v1/health`                                                                        |

`--include=dev` là bắt buộc: có `NODE_ENV=production` thì `npm ci` bỏ dev dependency, trong khi build cần Prisma CLI, Nest CLI và TypeScript. Gói Free không có bước pre-deploy nên migration chạy trong start command. Gói Free ngủ sau 15 phút không có request, lần đầu mở lại mất khoảng 50 giây.

Biến môi trường: `NODE_ENV=production`, `NODE_VERSION=24.11.0`, `DATABASE_URL`, `DIRECT_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (mỗi biến tạo bằng `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`), `CORS_ORIGINS` là địa chỉ Vercel, `REFRESH_COOKIE_SAME_SITE=lax`, `TRUSTED_PROXIES=2`, `LOG_LEVEL=info`.

`TRUSTED_PROXIES=2` nghĩa là tin hai tầng proxy: Vercel chuyển tiếp rồi tới load balancer của Render. Sau khi deploy, đăng nhập rồi xem trường `req.ip` trong log của Render. Nếu đó là IP của bạn thì đúng, nếu là IP của máy chủ Vercel thì tăng lên 3.

Hiện API chạy ở `https://vocab-app-rj0t.onrender.com`, deploy từ nhánh `develop` cho đến khi phát hành vào `main` (việc 1.35). Biến `JWT_*` tạo bằng nút Generate của Render.

## Vercel (web)

| Mục            | Giá trị                                               |
| -------------- | ----------------------------------------------------- |
| Root directory | `apps/web`                                            |
| Build command  | `cd ../.. && npx turbo run build --filter=@vocab/web` |

Biến mới dùng lúc build phải khai báo trong `env` của `turbo.json`, nếu không Turborepo bỏ biến đó và `rewrites` không được tạo, `/api/v1` trả 404.

Biến môi trường: `NEXT_PUBLIC_API_URL=/api/v1`, `API_INTERNAL_URL=https://<tên>.onrender.com/api/v1`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` để trống nếu chưa bật Google. Chọn loại Config, tick Production và Preview. Biến `NEXT_PUBLIC_*` nằm trong code gửi xuống trình duyệt nên không phải secret, và chỉ có tác dụng sau khi build lại.

Lần deploy đầu khi tạo project luôn lên Production. Các lần sau chỉ nhánh trong **Settings**, **Environments**, **Production**, **Branch Tracking** mới lên Production, nhánh khác thành Preview. Đặt nhánh này là `develop` cho đến khi phát hành vào `main`, giống Render. Bản Preview cần lên ngay thì dùng **Promote to Production**.

Gói Free giới hạn 100 lần deploy mỗi ngày, mỗi lần push lên nhánh PR từng tạo một bản Preview và làm hết lượt (`api-deployments-free-per-day`). `apps/web/vercel.json` đặt `ignoreCommand` chạy `scripts/vercel-ignore-build.sh`: chỉ build khi push vào `develop` hoặc `main` và có thay đổi ở `apps/web`, `packages/shared`, `package.json`, `package-lock.json` hoặc `turbo.json` kể từ bản deploy thành công gần nhất của nhánh (`VERCEL_GIT_PREVIOUS_SHA`; không có thì so với commit trước). So với bản deploy gần nhất vì merge kiểu rebase đẩy nhiều commit một lúc, commit cuối có thể chỉ đổi API. Nhánh PR không có bản Preview, CI (Verify, E2E) vẫn kiểm tra như cũ. Cần Preview cho một nhánh thì bấm **Redeploy** trên Vercel hoặc tạm thêm nhánh vào script.

Hiện web chạy ở `https://vocab-app-nine-psi.vercel.app`.

## Cấp vai trò ADMIN, TEACHER

Tài khoản mới luôn là `STUDENT`. Khi chưa có quy trình cấp quyền giáo viên (việc 3.2), gán vai trò bằng lệnh sau. Tài khoản phải đăng ký trên web trước.

```bash
npm run user:set-role -w @vocab/api -- ban@example.com ADMIN     # hoặc TEACHER, STUDENT
```

Lệnh dùng `DATABASE_URL` trong `apps/api/.env`. Muốn đổi trên production thì chạy ở máy với chuỗi kết nối Neon (lấy ở biến `DATABASE_URL` của Render), không commit chuỗi này:

```bash
DATABASE_URL="postgresql://..." npm run user:set-role -w @vocab/api -- ban@example.com ADMIN
```

API đọc vai trò từ database ở mỗi request nên quyền mới có hiệu lực ngay, chỉ cần tải lại trang web.

## Phát hành từ `develop` vào `main` (việc 1.35)

Hiện Vercel (Production Branch) và Render (Branch) đều deploy từ `develop`, nên `develop` đang là production. Quy trình đích: `main` là production, `develop` là staging (việc 2.3).

1. Mở PR `develop` vào `main`, CI xanh, người phụ trách xác nhận rồi merge.
2. Vercel: **Settings**, **Environments**, **Production**, **Branch Tracking** đổi `develop` thành `main`. Bấm **Redeploy** bản mới nhất của `main`.
3. Render: **Settings**, **Build & Deploy**, **Branch** đổi thành `main`, **Auto-Deploy** để **On Commit**. Bấm **Manual Deploy**, **Deploy latest commit**.
4. Chạy mục "Kiểm tra sau khi deploy" ở cuối trang này, rồi đo Lighthouse (việc 1.34).
5. Từ đó: việc thường merge vào `develop`; khi muốn đưa lên production thì mở PR `develop` vào `main`. Lỗi trên production thì Rollback ở Render và Vercel về bản trước, sửa trên `develop` rồi phát hành lại.

Chưa muốn tách hai môi trường thì có thể giữ `develop` là production, khi đó bỏ qua bước 2, 3 và chỉ dùng `main` để đánh dấu bản đã phát hành.

## Dịch vụ cần tài khoản

Code của các việc này viết được trước bằng adapter có bản giả: chạy ở máy và trong test không cần tài khoản. Khi biến môi trường có giá trị thì app dùng dịch vụ thật; thiếu thì tính năng đó tắt hoặc dùng bản giả, app vẫn chạy. Mọi khoá đặt trong **Environment** của Render, không commit vào repo. Tên biến chính thức nằm trong `.env.example` và `apps/api/src/config/env.ts` khi việc tương ứng được làm.

### Gửi email quên mật khẩu (việc 1.49): Brevo

Chọn Brevo vì gói miễn phí 300 thư mỗi ngày và gửi được khi chỉ xác minh một địa chỉ email, chưa cần tên miền riêng.

1. Đăng ký tại brevo.com, vào **Senders, Domains & Dedicated IPs**, **Senders**, thêm email gửi (ví dụ email Gmail của dự án) và bấm liên kết xác minh trong hộp thư.
2. Vào **SMTP & API**, **API Keys**, tạo khoá tên `vocab-app`.
3. Render, Environment: `BREVO_API_KEY` = khoá vừa tạo, `EMAIL_FROM` = email đã xác minh, `WEB_ORIGIN` = địa chỉ web trên Vercel (để tạo liên kết đặt lại mật khẩu).
4. Thử: trang Quên mật khẩu, nhập email của bạn, thư tới trong một phút. Thư đầu có thể vào Spam.

Khi có tên miền riêng, xác minh tên miền trong Brevo để thư ít vào Spam hơn.

### Rate limit và cache dùng chung (việc 2.1, 2.2): Upstash Redis

1. Đăng ký tại upstash.com, **Create Database**, loại Redis, region **ap-southeast-1 (Singapore)** cho gần Render, gói Free.
2. Mở database, mục **REST API**, chép `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN`.
3. Dán hai biến vào Environment của Render (và của staging nếu có).
4. Thiếu hai biến này thì API dùng bộ đếm trong bộ nhớ và không cache bộ từ công khai, vẫn đúng khi chỉ có một instance.
5. Kiểm tra: sau khi deploy, log của Render không có dòng "Không gọi được Redis", và trong Upstash **Data Browser** thấy khoá `rl:*` khi có người đăng nhập, `set:public:*` khi có người xem bộ công khai.

### Môi trường staging (việc 2.3): Neon branch, Render, Vercel

Làm sau khi phát hành vào `main`, vì staging sẽ theo `develop`.

1. Neon: **Branches**, **Create branch** tên `staging` từ `main`. Chép chuỗi kết nối pooled và direct của branch này.
2. Render: **New**, **Web Service**, cùng repo, Branch `develop`, cùng Build và Start command như mục Render ở trên. Environment giống production nhưng `DATABASE_URL`, `DIRECT_URL` là của branch `staging`, `JWT_*` tạo mới, `CORS_ORIGINS` là địa chỉ web staging.
3. Vercel: **Settings**, **Domains**, thêm một tên miền phụ cho nhánh `develop` (ví dụ `vocab-app-staging.vercel.app`, chọn **Git Branch** là `develop`). **Environment Variables** thêm `API_INTERNAL_URL` cho môi trường Preview trỏ tới API staging.
4. Gói Free của Render có 750 giờ mỗi tháng cho tất cả service, hai service cùng ngủ khi không dùng nên vẫn đủ.

### Ảnh và âm thanh (việc 2.5, 2.6): Cloudflare R2

1. Đăng ký Cloudflare, vào **R2 Object Storage**, bật R2 (cần thêm thẻ thanh toán nhưng gói Free có 10 GB và không tính tiền tải xuống).
2. **Create bucket** tên `vocab-media`, location Asia Pacific.
3. Trong bucket, **Settings**, **Public access**, bật **R2.dev subdomain** và chép địa chỉ công khai. **CORS Policy** cho phép `PUT`, `GET` từ địa chỉ web production và staging, `AllowedHeaders` là `content-type`.
4. **R2**, **Manage API tokens**, **Create API token**, quyền **Object Read & Write**, chỉ bucket `vocab-media`. Chép Account ID, Access Key ID, Secret Access Key.
5. Render, Environment: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=vocab-media`, `R2_PUBLIC_URL` là địa chỉ công khai ở bước 3.
6. Âm thanh TTS (2.6) cần thêm một dịch vụ đọc văn bản (ví dụ Google Cloud Text-to-Speech, có gói miễn phí nhưng cần thẻ). Chưa có thì app tiếp tục dùng giọng đọc của trình duyệt như hiện nay.

### Theo dõi lỗi và uptime (việc 1.31, đã hoãn)

Sentry đã hoãn khỏi MVP theo quyết định ngày 2026-11-20: xem lỗi bằng log của Render (**Logs**) và Vercel (**Logs**). Muốn biết khi API sập thì tạo monitor miễn phí ở uptimerobot.com gọi `https://<api>/api/v1/health` mỗi 5 phút và gửi email khi lỗi.

## Job nhắc học hằng ngày (việc 7.7)

Render gói Free ngủ khi rảnh nên API không tự hẹn giờ. Workflow `.github/workflows/daily-reminders.yml` chạy lúc 13:00 UTC (20:00 giờ Việt Nam), gọi `POST /api/v1/internal/jobs/daily-reminders` kèm header `X-Job-Secret`; lần gọi này cũng đánh thức API.

1. Tạo khoá: `openssl rand -hex 32`.
2. Render, **Environment**: thêm `JOBS_SECRET` bằng khoá vừa tạo. Để trống thì endpoint trả 404 và không có nhắc học.
3. GitHub, **Settings**, **Secrets and variables**, **Actions**: thêm `JOBS_SECRET` (cùng khoá) và `REMINDERS_API_URL` (ví dụ `https://vocab-app-rj0t.onrender.com`, không có `/api/v1`). Thiếu một trong hai thì workflow bỏ qua, không báo lỗi.
4. Chạy thử: tab **Actions**, **Daily reminders**, **Run workflow**. Chạy lại trong ngày không gửi trùng nhờ bảng `ReminderLog`.

Lịch của GitHub Actions có thể trễ nhiều giờ (lịch 20:00 ngày 27/11 chạy lúc 04:51 sáng hôm sau). Vì vậy job chỉ nhắc chuỗi và ôn khi được gọi từ 18:00 đến trước 23:00 giờ Việt Nam; gọi ngoài khung thì bỏ qua phần này và không ghi `ReminderLog`, lần gọi đúng giờ trong ngày vẫn nhắc. Nên hẹn giờ thêm ở cron-job.org (miễn phí, chạy đúng giờ), giữ workflow GitHub làm dự phòng:

1. Đăng ký cron-job.org, **Create cronjob**.
2. URL: `https://<api>/api/v1/internal/jobs/daily-reminders`, lịch mỗi ngày 20:00, múi giờ `Asia/Ho_Chi_Minh`.
3. **Advanced**: method `POST`, header `X-Job-Secret` bằng `JOBS_SECRET`, timeout tối đa (API đang ngủ cần khoảng 90 giây để dậy). Bật thử lại khi lỗi nếu gói cho phép.
4. Hai nơi cùng gọi trong một tối không gửi trùng nhờ `ReminderLog`.

## Mail nhắc học (việc 7.9)

Dùng lại `BREVO_API_KEY` và `EMAIL_FROM` của quên mật khẩu. `MAIL_DAILY_LIMIT` là hạn mức mỗi ngày của gói Brevo (gói free khoảng 300, xem lại trên Brevo); job chừa 50 mail cho quên mật khẩu. Địa chỉ gửi là `@gmail.com` thì mail dễ vào Spam, nên dùng tên miền riêng đã cấu hình SPF và DKIM trong Brevo khi có.

## Web Push (việc 7.8)

Miễn phí, không cần tài khoản dịch vụ. Thiếu khoá thì thông báo đẩy tắt, nhắc học vẫn có trong chuông.

1. Tạo cặp khoá một lần: `npx web-push generate-vapid-keys`. Giữ nguyên cặp khoá này, đổi khoá thì mọi đăng ký cũ hết hiệu lực.
2. Render, **Environment**: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (ví dụ `mailto:<email quản trị>`).
3. Service worker chỉ đăng ký ở bản production, nên thử Web Push trên bản deploy, không thử ở `npm run dev`.
4. iPhone, iPad chỉ nhận thông báo khi người dùng thêm app vào màn hình chính và dùng iOS 16.4 trở lên.

## Google OAuth

Web dùng nút đăng nhập của Google, API kiểm tra token với cùng Client ID. Đặt Client ID ở cả hai nơi: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` trên Vercel, `GOOGLE_CLIENT_ID` trên Render. Hai giá trị khác nhau thì API từ chối đăng nhập.

1. Google Cloud, **Google Auth Platform**, **Clients**: tạo client loại Web application. Thêm địa chỉ web và `http://localhost:3000` vào **Authorized JavaScript origins**. Thêm `https://<web>.vercel.app/api/v1/auth/google/redirect` và `http://localhost:3000/api/v1/auth/google/redirect` vào **Authorized redirect URIs**: trên mobile nút Google dùng chế độ redirect vì popup mất liên kết với trang gốc và kẹt ở màn hình trắng. Không cần client secret.
2. **Branding**: điền tên app, email hỗ trợ, trang chủ, `/privacy`, `/terms`. **Authorized domains** là tên máy đầy đủ, ví dụ `vocab-app-nine-psi.vercel.app`, vì `vercel.app` là tên miền dùng chung. Không tải logo, có logo thì phải chờ Google duyệt.
3. **Audience**: **Publish app**. App chỉ xin email và tên nên không cần Google duyệt. Để chế độ Testing thì chỉ email trong **Test users** đăng nhập được.

Khi đổi địa chỉ web, cập nhật **Authorized JavaScript origins**, **Authorized redirect URIs** và **Authorized domains**. Chế độ redirect cần API nhận được cookie do web đặt, tức API phải đi qua chuyển tiếp `/api/v1` hoặc chung tên miền với web.

## Kiểm tra sau khi deploy

1. `https://<tên>.onrender.com/api/v1/health` trả `{"status":"ok","db":"up"}`.
2. `https://<web>.vercel.app/api/v1/health` trả cùng kết quả, tức chuyển tiếp đã chạy.
3. Đăng ký, đăng nhập, tải lại trang vẫn còn đăng nhập, kể cả trên Safari. Cookie `refresh_token` có `HttpOnly`, `Secure`, `SameSite=Lax`.
4. Trang đăng nhập có nút Google và đăng nhập Google được, cả trên máy tính (popup) lẫn điện thoại (chuyển trang rồi quay về trang đích).
5. `/privacy` và `/terms` mở được, footer trang chủ có link tới hai trang.
6. Tạo bộ từ, học một phiên, xem thống kê.
