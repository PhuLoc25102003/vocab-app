# Use case: nền tảng và phát hành

## UC-P1. Nền tảng dự án

Giai đoạn 0 không có chức năng cho người dùng cuối. Mỗi việc được coi là đủ khi lệnh hoặc hành vi dưới đây đúng.

| Việc | Kết quả phải có                         | Cách kiểm tra                                     |
| ---- | --------------------------------------- | ------------------------------------------------- |
| 0.1  | Monorepo web, API, shared               | `npm run build` từ repo sạch                      |
| 0.2  | Postgres, Prisma, `GET /health`         | `npm run db:up`, gọi `/api/v1/health`             |
| 0.3  | Tài liệu và skill dự án                 | Đối chiếu với code khi làm việc liên quan         |
| 0.4  | Node 24                                 | `node -v` khớp `.nvmrc`, CI dùng cùng phiên bản   |
| 0.5  | Repo và nhánh `develop`                 | PR mặc định nhắm vào `develop`                    |
| 0.6  | CI `Verify`                             | PR có lỗi lint hoặc test bị chặn                  |
| 0.7  | `onDelete: Cascade`                     | Integration xoá người dùng, dữ liệu liên quan mất |
| 0.8  | Branch protection                       | Không merge được khi `Verify` đỏ                  |
| 0.9  | Design token và font                    | Không có mã màu trong `.tsx`, xem light và dark   |
| 0.10 | Mã lỗi, `AppError`, phân trang, Swagger | `app.integration`, `pagination.test`              |
| 0.11 | Bộ test và database test                | `npm test` chạy đủ ba workspace                   |
| 0.12 | Layout, điều hướng, trạng thái dữ liệu  | `app-nav.test`, `state-views.test`                |
| 0.13 | Husky, boundaries, Dependabot, audit    | Commit sai định dạng hoặc import sai tầng bị chặn |

## UC-P2. Trang giới thiệu

- **Việc:** 1.29. **Người dùng:** khách. **Trạng thái:** Đủ.
- **Phải có:** thông điệp chính, thẻ mẫu, 4 chế độ học, cách dùng, nút theo phiên đăng nhập, chỉ nêu tính năng đã có.
- **Ngoại lệ:** người đã đăng nhập thấy nút vào app; JavaScript chưa chạy xong vẫn đọc được nội dung.
- **Test đã có:** `landing-page.test`, E2E đăng ký từ trang chủ, kiểm tra light, dark 360 px.
- **Khi đổi sau này:** nhắc import sau khi làm xong 1.23.

## UC-P3. Triển khai môi trường thật

- **Việc:** 1.18, 1.19, 1.20. **Người dùng:** người vận hành. **Trạng thái:** Chờ quyết định, cần tài khoản Neon, Render, Vercel và tên miền.
- **Phải có:**
  - Neon có `DATABASE_URL` và `DIRECT_URL`, migration chạy khi deploy.
  - Render chạy API, có health check, `TRUSTED_PROXIES`, `CORS_ORIGINS`, secret riêng.
  - Vercel build web với `NEXT_PUBLIC_API_URL` đúng, CSP cho phép đúng API.
  - Cookie refresh hoạt động giữa web và API.
- **Luồng chính:** merge vào `main`, migration chạy, API và web tự deploy, smoke test qua.
- **Ngoại lệ:** migration lỗi thì không phát hành API mới; thiếu env thì API không khởi động; API ngủ khi rảnh thì web báo đang kết nối và cho thử lại.
- **Cách test:** smoke test trên URL thật gồm đăng ký, đăng nhập, tải lại trang vẫn giữ phiên, tạo bộ, học, đăng xuất; kiểm tra header, cookie `Secure`, CORS từ origin lạ.

## UC-P4. Xoá hẳn bộ từ đã xoá mềm

- **Việc:** 1.30. **Người dùng:** hệ thống. **Trạng thái:** Đủ. Đã chốt MVP không có thùng rác, xoá hẳn sau 30 ngày.
- **Phải có:** job chạy mỗi ngày, chỉ xoá bộ có `deletedAt` quá 30 ngày, xoá theo lô, ghi log số lượng, không chạy trùng khi có nhiều instance.
- **Ngoại lệ:** lỗi giữa chừng thì lần sau chạy tiếp; bộ chưa đủ 30 ngày không bị đụng; dữ liệu học liên quan bị xoá theo cascade.
- **Cách test:** integration với mốc đúng 30 ngày, trước và sau mốc; hai job chạy cùng lúc; bộ chưa xoá không đổi.
- **Test đã có:** `sets-purge.integration` gồm quá mốc, đúng mốc, chưa đủ mốc, bộ chưa xoá, cascade dữ liệu học, xoá theo lô, hai lần chạy cùng lúc, bỏ qua khi khoá đang bị giữ.

## UC-P5. Log và giám sát

- **Việc:** 1.50 (log), 1.31 (Sentry, uptime). **Người dùng:** người vận hành. **Trạng thái:** Log đã xong, phần Sentry và uptime cần tài khoản.
- **Phải có:** log JSON bằng Pino có `requestId`, ẩn mật khẩu, token, cookie; Sentry cho web và API; theo dõi `/health`.
- **Ngoại lệ:** thiếu DSN thì app vẫn chạy; lỗi 4xx nghiệp vụ không gửi Sentry.
- **Test đã có:** `logging.integration.test` kiểm tra log là JSON có `reqId`, không chứa mật khẩu, token, cookie, query string.
- **Cách test còn lại:** tạo lỗi thử trên staging và thấy trong Sentry; tắt API và nhận cảnh báo uptime.

## UC-P6. Bảo mật

- **Việc:** 1.32, 1.48. **Người dùng:** toàn hệ thống. **Trạng thái:** Đủ.
- **Phải có:** CSP và header bảo mật, checklist trong `docs/04-security.md`, giới hạn 100 request mỗi phút cho mỗi người dùng, 300 cho mỗi IP của khách.
- **Ngoại lệ:** vượt giới hạn trả 429 đúng định dạng lỗi; `/health` không bị giới hạn; học nhanh theo lô không bị chặn nhầm.
- **Test đã có:** `security-headers.test`, `rate-limit.integration`, kiểm tra CSP trên trình duyệt.

## UC-P7. Test đầu cuối

- **Việc:** 1.33, 1.47. **Người dùng:** đội phát triển. **Trạng thái:** Đủ.
- **Phải có:** database `vocab_e2e` riêng, cổng riêng, job CI, phủ các luồng quan trọng nhất.
- **Đã phủ:** đăng ký, tạo, sửa, tìm, xoá, sao chép bộ từ, cảnh báo rời form, nút quay lại sau khi lưu, 4 chế độ học, tải lại giữa phiên, Ôn hôm nay, thống kê, Khám phá và học thử của khách, trang tài khoản, trang 404.
- **Giới hạn:** tối đa 3 lần đăng ký trong một lần chạy vì rate limit theo IP.
- **Yêu cầu:** test không phụ thuộc thứ tự câu hỏi, không dùng `sleep` cố định, chạy dưới 5 phút.

## UC-P8. Rà chất lượng

- **Việc:** 1.34. **Người dùng:** mọi người. **Trạng thái:** Thiếu, Performance chưa đạt.
- **Phải có:** mọi trang đạt bàn phím, focus, vùng bấm 44 px, light, dark, 360 px, `prefers-reduced-motion`; Lighthouse trang học đạt Performance từ 90 và Accessibility từ 95.
- **Đã đạt:** E2E quét axe theo WCAG 2.2 AA, tràn ngang, vùng bấm 44 px, vòng focus ở mọi màn hình, light 1280 px và dark 360 px, với từ dài 200 ký tự và khi giảm chuyển động. Lighthouse Accessibility 100 ở trang chủ, trang công khai và trang học thử.
- **Chưa đạt:** Lighthouse Performance trên máy local, mobile giả lập: trang chủ 87, trang công khai 88, trang học thử 85. LCP khoảng 4 giây vì tải khoảng 200 KB font và 255 KB JavaScript trước khi hiện chữ, trang học còn chờ gọi API.
- **Hướng xử lý:** đo lại trên production sau việc 1.20; nếu vẫn dưới 90 thì bớt độ đậm font hoặc render sẵn câu đầu của trang học ở server.

## UC-P9. Phát hành MVP

- **Việc:** 1.35. **Người dùng:** người phụ trách. **Trạng thái:** Chưa làm, cần xác nhận rõ PR vào `main`.
- **Điều kiện:** các việc còn lại của Giai đoạn 1 xong, checklist bảo mật đạt, CI xanh, có cách rollback.
- **Luồng chính:** mở PR từ `develop` vào `main`, người phụ trách xác nhận, merge, chạy smoke test production.
- **Ngoại lệ:** smoke test lỗi thì rollback bản deploy, không sửa trực tiếp trên `main`.

## UC-P10. Trang lỗi chung

- **Việc:** 1.41. **Người dùng:** mọi người. **Trạng thái:** Đủ.
- **Phải có:** trang 404 tiếng Việt có logo và nút về đúng nơi theo phiên, `global-error` khi layout gốc lỗi, không lộ thông tin kỹ thuật.
- **Ngoại lệ:** trang lỗi dùng được ở dark và 360 px; đường dẫn sai không được index.
- **Test đã có:** `session-link.test`, E2E đường dẫn sai trả 404 và có lối về.
