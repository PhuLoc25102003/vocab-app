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

Gói Free giới hạn 100 lần deploy mỗi ngày, mỗi lần push lên nhánh PR từng tạo một bản Preview và làm hết lượt (`api-deployments-free-per-day`). `apps/web/vercel.json` đặt `ignoreCommand` chạy `scripts/vercel-ignore-build.sh`: chỉ build khi push vào `develop` hoặc `main` và commit có đổi `apps/web`, `packages/shared`, `package.json`, `package-lock.json` hoặc `turbo.json`. Nhánh PR không có bản Preview, CI (Verify, E2E) vẫn kiểm tra như cũ. Cần Preview cho một nhánh thì bấm **Redeploy** trên Vercel hoặc tạm thêm nhánh vào script.

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

## Google OAuth

Web dùng nút đăng nhập của Google, API kiểm tra token với cùng Client ID. Đặt Client ID ở cả hai nơi: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` trên Vercel, `GOOGLE_CLIENT_ID` trên Render. Hai giá trị khác nhau thì API từ chối đăng nhập.

1. Google Cloud, **Google Auth Platform**, **Clients**: tạo client loại Web application. Thêm địa chỉ web và `http://localhost:3000` vào **Authorized JavaScript origins**, không cần redirect URI và client secret.
2. **Branding**: điền tên app, email hỗ trợ, trang chủ, `/privacy`, `/terms`. **Authorized domains** là tên máy đầy đủ, ví dụ `vocab-app-nine-psi.vercel.app`, vì `vercel.app` là tên miền dùng chung. Không tải logo, có logo thì phải chờ Google duyệt.
3. **Audience**: **Publish app**. App chỉ xin email và tên nên không cần Google duyệt. Để chế độ Testing thì chỉ email trong **Test users** đăng nhập được.

Khi đổi địa chỉ web, cập nhật **Authorized JavaScript origins** và **Authorized domains**.

## Kiểm tra sau khi deploy

1. `https://<tên>.onrender.com/api/v1/health` trả `{"status":"ok","db":"up"}`.
2. `https://<web>.vercel.app/api/v1/health` trả cùng kết quả, tức chuyển tiếp đã chạy.
3. Đăng ký, đăng nhập, tải lại trang vẫn còn đăng nhập, kể cả trên Safari. Cookie `refresh_token` có `HttpOnly`, `Secure`, `SameSite=Lax`.
4. Trang đăng nhập có nút Google và đăng nhập Google được.
5. `/privacy` và `/terms` mở được, footer trang chủ có link tới hai trang.
6. Tạo bộ từ, học một phiên, xem thống kê.
