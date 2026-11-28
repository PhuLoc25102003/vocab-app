# Tiến độ dự án

Cập nhật lần cuối: 2026-11-27

**Đang ở:** Đã hoàn thành các việc 6.10 đến 6.18 (ảnh minh hoạ, kiểm tra, cân đối banner #419, đồng bộ bảng #420, context menu & import #421, sticky header & offline đa chế độ #422, trung tâm quản trị toàn diện #423, giọng đọc tự nhiên #424, sticky table header và tối ưu mobile 6.17 #425, tối ưu nhận diện luyện nói, modal cảnh báo trình duyệt, trộn thẻ ngẫu nhiên mặc định và tối ưu nút chi tiết bộ từ mobile 6.18 #426). Còn phát hành vào `main` (1.35) và đo Lighthouse trên production (1.34).

**Việc tiếp theo:**

Làm trước các việc không cần người dùng xác nhận; việc cần tài khoản, quyết định hoặc phát hành để cuối và gom lại hỏi một lần.

1. Giai đoạn 7 đã xong. Cần bạn: chạy thử workflow Daily reminders, bật thử push ở Tài khoản, và tạo monitor UptimeRobot gọi `/api/v1/health` mỗi 5 phút để API Render không ngủ (`docs/perf-audit-2026-11-27.md`).
2. Phát hành `develop` vào `main` (việc 1.35), cần bạn xác nhận, các bước ở `docs/08-deploy.md`.
3. Đo lại Lighthouse trên production (việc 1.34), sau khi phát hành.

## Tổng quan

Tỉ lệ tính theo số đầu việc, không phản ánh khối lượng của từng việc.

| Giai đoạn               | Mục tiêu                                   |    Xong |    Tổng | Trạng thái |
| ----------------------- | ------------------------------------------ | ------: | ------: | ---------- |
| 0. Nền tảng             | Khung dự án và nền chung cho mọi tính năng |      13 |      13 | Xong       |
| 1. MVP                  | Học sinh dùng được trọn vẹn trên web thật  |      52 |      54 | Đang làm   |
| 2. Mở rộng              | Thêm chế độ học, nội dung và quản trị      |      41 |      43 | Đang làm   |
| 3. Lớp học              | Giáo viên giao bài và xem kết quả          |      14 |      14 | Xong       |
| 4. Luyện nói và offline | Luyện phát âm, học khi mất mạng            |       6 |       6 | Xong       |
| 5. Vai trò và lớp học   | Tổng quan theo vai trò, giao và nộp bài    |      39 |      39 | Xong       |
| 6. Đa ngôn ngữ          | Toàn bộ giao diện tiếng Việt và tiếng Anh  |      22 |      22 | Xong       |
| 7. Động lực và trò chơi | XP, chuỗi, xếp hạng, nhắc học, Mưa từ      |      33 |      33 | Xong       |
| **Toàn dự án**          |                                            | **220** | **224** | **98%**    |

## Cách cập nhật

- Làm theo thứ tự từ trên xuống, trừ khi việc sau không phụ thuộc việc trước.
- Mỗi việc tương ứng một issue và một PR. Việc quá lớn thì tách thành nhiều việc nhỏ ngay trong file này.
- Các việc làm tuần tự: một PR việc mở tại một thời điểm, merge xong mới làm việc sau.
- PR của một việc chứa luôn cập nhật docs: đổi `[ ]` thành `[x]` kèm số PR, chạy `npm run progress` (đếm `[x]` từng giai đoạn) và sửa "Đang ở", "Việc tiếp theo" nếu cần. Không mở PR `docs(progress): sync` riêng.
- Thêm hoặc tách việc mới thì gộp vào PR của việc đang làm hoặc việc kế tiếp, không mở PR docs riêng.
- Không ghi `Đang làm: <nhánh>` vào dòng của việc: dòng đó sẽ bị sửa lại khi xong và dễ xung đột.
- Một việc chỉ được tính là xong khi PR đã merge vào `develop`.
- Trước khi làm, đọc use case của việc trong `docs/use-cases/`.

## Giai đoạn 0: Nền tảng

### 0A. Khung dự án

- [x] **0.1** Monorepo npm workspaces + Turborepo, gồm web, API và `@vocab/shared`.
- [x] **0.2** PostgreSQL trong Docker, Prisma 7, migration đầu tiên, `GET /health`.
- [x] **0.3** Tài liệu `docs/`, `CLAUDE.md` và các skill dự án.
- [x] **0.4** Nâng lên Node 24 LTS.
- [x] **0.5** Repo GitHub, nhánh `develop`, skill `git-workflow` (#1).
- [x] **0.6** CI với job `Verify` (#2).

### 0B. Nền cho tính năng

**Xong khi:** có thể bắt đầu module auth mà không phải dựng thêm hạ tầng chung.

- [x] **0.7** Thêm `onDelete: Cascade` cho dữ liệu học và dữ liệu của người dùng (#3).
- [x] **0.8** Cấu hình GitHub: nhánh mặc định `develop`, branch protection yêu cầu `Verify`, cài `gh`.
- [x] **0.9** Áp dụng design tokens và font mới vào web theo `docs/05-ui-tokens.md` (#7).
- [x] **0.10** Nền API: mã lỗi trong shared, `AppError`, `paginationSchema`, `ok()`, `paginated()`, Swagger (#11).
- [x] **0.11** Bộ test: Vitest cho shared, API, web; Supertest; database test trong CI (#13, #14).
- [x] **0.12** Nền giao diện: shadcn/ui, layout app, điều hướng, `page-header`, `empty-state`, `error-state`, skeleton, thông báo, lưu lựa chọn theme (#16, #17).
- [x] **0.13** Kỷ luật code: Husky, lint-staged, `eslint-plugin-boundaries`, Dependabot và `npm audit` trong CI (#19).

## Giai đoạn 1: MVP

**Xong khi:** học sinh đăng ký được, tạo hoặc import bộ từ, học bằng 4 chế độ, có tiến độ và trang "Ôn hôm nay" trên môi trường production.

### 1A. Tài khoản và phân quyền

**Xong khi:** người dùng đăng nhập được, giữ phiên qua refresh token, route được bảo vệ đúng theo vai trò và quyền sở hữu.

- [x] **1.1** API đăng ký và đăng nhập email + mật khẩu: argon2id, rate limit, thông báo lỗi chung (#26, #27).
- [x] **1.2** JWT access và refresh: xoay vòng token, phát hiện dùng lại, đăng xuất, đăng xuất mọi thiết bị, xác thực trong `AuthGuard` (#29, #30, #31, #32).
- [x] **1.3** `@Roles`, `RolesGuard`, `@CheckOwnership`, `OwnershipGuard` (#34).
- [x] **1.4** API tài khoản: xem, sửa tên và mật khẩu, xoá tài khoản (#36, #37).
- [x] **1.5** Web: đăng ký, đăng nhập, auth store, tự refresh trong `lib/http.ts`, `proxy.ts`, component `Can` (#39, #40, #41, #42).
- [x] **1.6** Đăng nhập Google trên API và web (#48, #49).

### 1B. Bộ từ và thẻ từ

**Xong khi:** người dùng tạo, sửa, xoá, sao chép bộ từ và khách xem được bộ công khai.

- [x] **1.7** API bộ từ: danh sách, tìm bộ công khai, tạo, xem, sửa, xoá mềm (#44, #45, #46).
- [x] **1.8** `PUT /sets/:id/cards`: giữ `id` thẻ cũ, cập nhật `cardCount` trong transaction, giới hạn số thẻ và độ dài (#53).
- [x] **1.9** `POST /sets/:id/duplicate` (#55).
- [x] **1.10** Web: dashboard và danh sách bộ từ (#57).
- [x] **1.11** Web: tạo, sửa bộ từ và soạn thẻ (#60, #61, #63).
- [x] **1.12** Web: chi tiết bộ từ, trang công khai cho khách, cache bằng `use cache` (#65, #67).
- [x] **1.36** Web: trang Khám phá có tìm kiếm, nút quay lại, tên Nhớ Từ và logo (#71).

### 1C. Học bằng Flashcard

**Xong khi:** có một luồng hoàn chỉnh từ chọn bộ từ, học, lưu tiến độ đến xem kết quả.

- [x] **1.13** `packages/shared/src/study`: type, registry, chấm điểm, thuật toán SRS và unit test (#69).
- [x] **1.14** API phiên học: bắt đầu, gửi đáp án theo lô, kết thúc, cập nhật `CardProgress` (#73).
- [x] **1.15** Web: `study-shell`, session store, tiến độ trong phiên, màn hình kết quả (#75, #76).
- [x] **1.16** Chế độ Flashcard: lật thẻ, phím tắt, khách học không lưu tiến độ (#78).
- [x] **1.17** Phát âm: `lib/speech.ts` và `audio-button` (#80).

### 1D. Đưa lên môi trường thật

**Xong khi:** merge vào `main` tự deploy, đăng nhập và học được trên URL production.

- [x] **1.18** Neon, `DIRECT_URL`, chạy `prisma migrate deploy` khi deploy (#153).
- [x] **1.19** Deploy API lên Render, cấu hình env (gồm `TRUSTED_PROXIES`) và health check (#155).
- [x] **1.20** Deploy web lên Vercel, cấu hình domain, cookie refresh và CORS (#161).
- [x] **1.52** Trang Chính sách bảo mật và Điều khoản sử dụng, cần để publish đăng nhập Google (#159).

### 1E. Import

**Xong khi:** người dùng nhập được danh sách từ text, CSV, Excel, kèm phiên âm và câu ví dụ nếu có, tải được file mẫu và sửa lỗi từng dòng trước khi lưu.

- [x] **1.21** Parser text, CSV và `POST /import/preview`, kèm giới hạn kích thước và số dòng (#135).
- [x] **1.22** `POST /sets/:id/import`: lưu bằng transaction, tối đa 2.000 thẻ (#137).
- [x] **1.23** Web: tải file, dán text, xem trước và sửa lỗi (#142).
- [x] **1.53** Nhập thêm cột phiên âm (IPA) và câu ví dụ, cả hai không bắt buộc, áp dụng cho text, CSV và XLSX (#165).
- [x] **1.51** Đọc file XLSX trên trình duyệt bằng `read-excel-file`, chỉ lấy giá trị đã tính sẵn, không chạy công thức (ADR 0002) (#167).
- [x] **1.54** Nút tải file mẫu `.xlsx` và `.csv` ở trang nhập, nhận diện hàng tiêu đề của file mẫu để tự chọn cột. Cần 1.51 và 1.53 (#170).

### 1F. Chế độ học còn lại và ôn tập

**Xong khi:** đủ 4 chế độ MVP, có danh sách từ đến hạn và thống kê cơ bản.

- [x] **1.24** Chế độ Viết, chấm bằng gạch đỏ và đáp án đúng (#82).
- [x] **1.25** Chế độ Nghe viết (#84).
- [x] **1.26** Chế độ Trắc nghiệm (#86).
- [x] **1.27** `GET /review/due` và trang "Ôn hôm nay" (#88).
- [x] **1.28** `GET /stats/overview` và phần thống kê: streak, số từ đã thuộc, từ hay sai (#90, #91).

### 1G. Hoàn thiện và phát hành MVP

**Xong khi:** đạt checklist bảo mật, Definition of Done và bản MVP đã lên `main`.

- [x] **1.29** Trang giới thiệu sản phẩm (#93).
- [x] **1.30** Cron xoá hẳn bộ từ đã xoá mềm sau 30 ngày (#172).
- [x] **1.50** Log JSON bằng Pino, có `requestId`, ẩn mật khẩu, token, cookie (#133).
- [x] **1.32** Header bảo mật và CSP cho web, rà toàn bộ checklist trong `docs/04-security.md` (#96).
- [x] **1.33** Test E2E Playwright cho 3 đến 5 luồng chính (#98).
- [ ] **1.34** Rà accessibility, dark mode, màn hình 360 px, Lighthouse đạt mục tiêu. Accessibility đã đạt, Performance còn 85 đến 88.
- [ ] **1.35** PR phát hành từ `develop` vào `main`, kiểm tra production.

### Hoãn khỏi MVP

Không tính vào tổng số việc.

- **1.31** Sentry cho web và API. Hoãn theo quyết định ngày 2026-11-20: xem lỗi bằng log của Render và Vercel, theo dõi uptime bằng UptimeRobot miễn phí (`docs/08-deploy.md`).

### 1H. Bổ sung sau khi rà use case

**Xong khi:** các lỗ hổng trong `docs/use-cases/README.md` đã được xử lý. Làm phần này trước việc 1.34 và 1.35.

- [x] **1.37** Sau khi tạo hoặc sửa bộ từ, nút quay lại của trình duyệt không về form đã lưu (GAP-01, #103).
- [x] **1.38** Cảnh báo khi rời form chưa lưu bằng nút quay lại, nút huỷ hoặc menu (GAP-02, #105).
- [x] **1.39** Không mất đáp án khi tải lại hoặc đóng trang, tiếp tục được phiên đang học (GAP-03, #107).
- [x] **1.40** Trang tài khoản: đổi tên, đổi mật khẩu, đăng xuất mọi thiết bị, xoá tài khoản (GAP-04, #111).
- [x] **1.41** Trang 404 và trang lỗi toàn cục bằng tiếng Việt, có lối quay về (GAP-05, #113).
- [x] **1.42** Khách dùng được trang Khám phá (GAP-06, #115).
- [x] **1.43** Tìm kiếm và sắp xếp trong danh sách bộ từ của tôi (GAP-07, #117).
- [x] **1.44** Tổng quan báo số thẻ đến hạn, chi tiết bộ từ có tiến độ của bộ (GAP-08, #119).
- [x] **1.45** Học lại riêng thẻ sai, chọn chế độ khi ôn thẻ đến hạn (GAP-09, #121).
- [x] **1.46** Nút quay lại ở trang công khai và nút sao chép đường dẫn chia sẻ (GAP-10, #123).
- [x] **1.47** Mở rộng E2E cho sửa, xoá, sao chép, Khám phá, Ôn hôm nay và các chế độ còn lại (GAP-11, #125).
- [x] **1.48** Rate limit chung cho API (GAP-12, #95, #127).
- [x] **1.49a** API quên mật khẩu (GAP-13, #300): `POST /auth/forgot-password`, `POST /auth/reset-password`, bảng `PasswordResetToken`, adapter `Mailer` gửi qua Brevo, thiếu `BREVO_API_KEY` thì dùng bộ gửi thư trong bộ nhớ và ghi log.
- [x] **1.49b** Trang `/forgot-password`, `/reset-password` và liên kết "Quên mật khẩu?" ở trang đăng nhập. Token được xoá khỏi thanh địa chỉ ngay khi mở trang, trang không gửi `Referer` (#302).

## Giai đoạn 2: Mở rộng

**Xong khi:** đủ 8 chế độ học, có quản lý thư mục, ảnh và công cụ quản trị.

### 2A. Hạ tầng

- [x] **2.1** Rate limit dùng Upstash Redis qua adapter, thiếu `UPSTASH_REDIS_REST_URL` thì giữ bộ đếm trong bộ nhớ (#304).
- [x] **2.2** Cache bộ từ công khai phía API trên cùng Redis, xoá cache khi sửa, xoá hoặc đổi phạm vi; thiếu Redis thì không cache (#306).
- [ ] **2.3** Môi trường staging cho `develop`: Neon branch, Render service thứ hai, tên miền Vercel cho nhánh `develop`. Làm sau 1.35, cần thao tác trên dashboard.

### 2B. Nội dung

- [x] **2.4** Thư mục bộ từ trên API và web (#151).
- [x] **2.5a** API ảnh cho thẻ: `GET /uploads/config`, `POST /uploads/presign` qua adapter `ObjectStorage` (R2, ký SigV4), thẻ nhận `imageUrl` trong kho của app; thiếu khoá R2 thì trả 503 (#308).
- [x] **2.5b** Giao diện ảnh cho thẻ: nút thêm ảnh trong trình sửa thẻ (ẩn khi chưa bật), xem trước, gỡ ảnh, hiện ảnh ở trang bộ từ; CSP cho phép `*.r2.dev` và tải lên `*.r2.cloudflarestorage.com` (#310).
- [x] **2.5c** Hiện ảnh của thẻ khi học: câu hỏi Flashcard (mặt nghĩa) và Luyện viết (cạnh nghĩa) có `imageUrl`; chế độ chọn hoặc ghép đáp án không có ảnh để không lộ đáp án (#313).
- [x] **2.5d** Tìm và chọn ảnh minh hoạ trực tuyến cho thẻ qua Unsplash / Pixabay API: nút tìm ảnh 1-click cạnh ô từ vựng ở form thẻ; hỗ trợ cột hình ảnh ở trang import bộ từ; hiển thị ảnh minh hoạ ở các chế độ học (Flashcard, Learn, Write, Cloze); không phụ thuộc R2; UC-X3b trong `docs/use-cases/05-lo-trinh.md` (#416).
- [ ] **2.6** Tạo và lưu âm thanh TTS lên R2. Cần chọn dịch vụ TTS; chưa có thì giữ giọng đọc của trình duyệt.

### 2C. Chế độ học

- [x] **2.7** Chế độ Learn, phần strategy và API: trộn trắc nghiệm và gõ từ theo mức nhớ (#174).
- [x] **2.13** Giao diện chế độ Learn: vòng 7 câu, câu sai được hỏi lại trong vòng đến khi đúng (#178).
- [x] **2.8** Chế độ Điền từ (#144).
- [x] **2.9** Chế độ Ghép cặp (#146).
- [x] **2.10** Chế độ Kiểm tra: trộn trắc nghiệm và gõ từ, phần 20 câu, nộp một lần (#180).

### 2D. Quản trị

- [x] **2.11** API quản trị người dùng: `GET /admin/users`, khoá và mở khoá tài khoản (#182).
- [x] **2.14** Trang quản lý người dùng cho ADMIN: tìm, khoá kèm lý do, mở khoá (#184).
- [x] **2.12** API ẩn và bỏ ẩn bộ từ vi phạm, bộ bị ẩn không còn với người khác (#186).
- [x] **2.15** Giao diện ẩn bộ từ: nút ẩn kèm lý do cho ADMIN, chủ bộ thấy thông báo bộ đang bị ẩn (#188).

### 2E. Trải nghiệm và giao diện

**Xong khi:** các trang chính cân đối, dễ hiểu, có cá tính riêng; người học hiểu vì sao thẻ đến hạn và khi nào được tính là đã thuộc. Thiết kế theo skill `ui-ux-pro` và `docs/05-ui-tokens.md`, mọi hiệu ứng tôn trọng `prefers-reduced-motion`.

- [x] **2.16** Bố cục cân đối: nội dung trang căn giữa với độ rộng tối đa nhất quán, form căn giữa, không dồn sang trái ở màn hình rộng (#196).
- [x] **2.17** Header hiện tên hiển thị cạnh ảnh đại diện, mở menu tài khoản (Tài khoản, Quản lý người dùng với ADMIN, Đăng xuất) (#198).
- [x] **2.18** Ô chọn (dropdown) mới thay `select` mặc định: đẹp, đúng token, dùng được bằng bàn phím và trình đọc màn hình (#203).
- [x] **2.19** Chế độ học trên trang bộ từ gom thành lưới thẻ có icon và mô tả ngắn, một nút chính "Bắt đầu học", thay hàng nút trải dài (#206).
- [x] **2.20** Mức nhớ từng thẻ (Mới, Đang học, Đã thuộc) và ngày ôn tiếp theo trên trang bộ từ, kèm giải thích điều kiện đã thuộc (#208).
- [x] **2.26** Trang Ôn hôm nay giải thích lịch ôn và hiện thẻ sắp đến hạn; ô "Từ đã thuộc" ở Tổng quan có chú thích điều kiện (#222).
- [x] **2.21** Trang Tổng quan nổi bật hơn: việc nên làm tiếp, bốn ô số liệu, biểu đồ hoạt động 7 ngày, thanh phân bố mức nhớ (#210).
- [x] **2.27** Tổng quan cho ADMIN: số người dùng, bộ từ, bộ bị ẩn, tài khoản bị khoá (#224).
- [x] **2.22** Phân biệt Bộ từ và Khám phá: Bộ từ là thư viện dạng danh sách để quản lý, Khám phá là lưới bộ của cộng đồng có tác giả, mô tả và số thẻ; mô tả trang nói rõ vai trò (#212).
- [x] **2.23** Giọng đọc: chọn Anh Mỹ hoặc Anh Anh, tốc độ bình thường hoặc chậm, nút nghe chậm khi học, lưu lựa chọn trên thiết bị (#216).
- [x] **2.24** Giao diện khi học đẹp hơn: thẻ và đáp án rõ ràng, phản hồi đúng sai có chuyển động nhẹ, màn kết quả có tóm tắt và khích lệ (#218).
- [x] **2.28** Header trang bộ từ gọn: chỉ còn "Sửa bộ từ" và menu "Thao tác khác", thư mục thành chip trên dòng thông tin (#245).
- [x] **2.29** Thẻ bộ từ dùng chung cho Bộ từ, Khám phá và "Bộ từ gần đây" ở Tổng quan, hiển thị dạng lưới (#249).
- [x] **2.30** Thư mục kiểu trình quản lý file: cột thư mục cuộn riêng có ô lọc, mở và đóng thư mục kèm đường dẫn, tạo, đổi tên, xoá ngay trên cột; mỗi thẻ bộ từ có menu chuyển vào hoặc gỡ khỏi thư mục (#251).
- [x] **2.31** "Bắt đầu học" là lộ trình nhiều kỹ năng liên tiếp (xem thẻ, trắc nghiệm, ghép cặp, viết), Flashcard thành một chế độ riêng trong lưới (#263).
- [x] **2.34** Kéo thả thẻ bộ từ vào thư mục trên cột thư mục, thả vào "Chưa xếp thư mục" để gỡ; dùng được bằng chuột và cảm ứng, menu của thẻ vẫn là cách cho bàn phím (#261).
- [x] **2.35** Thiết kế lại trang Ôn hôm nay: khối tóm tắt nổi bật (số thẻ đến hạn, chế độ ôn, nút ôn tất cả), bộ đến hạn dùng thẻ bộ từ chung, "Khi nào thẻ đến hạn ôn?" là nút rõ ràng có icon và mũi tên (#253).
- [x] **2.36** Rời trang khi đang tạo, sửa bộ từ hoặc nhập từ file mà có dữ liệu chưa lưu: chuyển trang trong app hỏi bằng hộp thoại của app (không dùng `window.confirm`); đóng tab hoặc tải lại vẫn dùng hộp thoại của trình duyệt vì trình duyệt không cho tuỳ biến. Chưa nhập gì thì không hỏi (#257).
- [x] **2.32** Trang tạo và sửa bộ từ: danh sách thẻ nằm trong khung có thanh cuộn riêng, nút thêm thẻ luôn thấy được (#259).
- [x] **2.33** Mọi thao tác xoá (bộ từ, thẻ, thư mục, bản offline, tài khoản, đăng xuất mọi thiết bị) hỏi lại bằng hộp thoại xác nhận, không thay nội dung tại chỗ làm xô lệch bố cục (#247).
- [x] **2.25** Thiết kế lại trang giới thiệu: hiện đại, có hiệu ứng khi cuộn, minh hoạ các chế độ học, lời kêu gọi rõ ràng; đạt Lighthouse như trước (#220).
- [x] **2.37** Trang nhập dễ hiểu: chia ba bước (lấy file mẫu, đưa danh sách vào, kiểm tra cách đọc); "Ký tự phân cách" đổi thành "Từ và nghĩa cách nhau bằng" kèm ví dụ cho từng lựa chọn và báo ký tự đã tự nhận; ô chọn cột hiện giá trị của dòng đầu ("Cột 1: apple"); phần cách đọc thu gọn khi đã tự nhận đúng (#271).
- [x] **2.38** File mẫu rõ ràng: `.xlsx` có tiêu đề in đậm có nền, cố định hàng tiêu đề, độ rộng cột vừa nội dung, 6 đến 8 dòng ví dụ, sheet thứ hai "Hướng dẫn"; bỏ nút tải mẫu `.csv` vì Excel tiếng Việt mở ra dồn hết vào cột A (vẫn nhận file `.csv` khi tải lên) (#273).
- [x] **2.39** Form tạo và sửa bộ từ gọn: mô tả 2 dòng tự giãn, ngôn ngữ của từ và nghĩa chung một hàng có nút đảo chiều, "Ai xem được" thành hai lựa chọn có mô tả ai xem được, ai sao chép được (#275).
- [x] **2.40** Trang công khai theo thiết kế mới: header như trang bộ từ, nút chính "Học thử" và lưới chế độ học dùng chung, danh sách thẻ như trang bộ từ; người đã đăng nhập mở đường dẫn công khai thì vào thẳng trang bộ từ trong app; bỏ link "Xem trang công khai" của chủ bộ, giữ "Sao chép đường dẫn" (#277).

## Giai đoạn 3: Lớp học

**Xong khi:** giáo viên tạo lớp, giao bộ từ và xem được kết quả của học sinh.

- [x] **3.1** Schema `Class`, `ClassMember`, `Assignment` (#238).
- [x] **3.2** Quy trình cấp vai trò giáo viên: ADMIN đổi vai trò trực tiếp ở trang Quản lý người dùng (`PATCH /admin/users/:id/role`), không cần người dùng gửi yêu cầu. Lệnh `user:set-role` (3.11) dùng để tạo ADMIN đầu tiên.
- [x] **3.3** API giáo viên tạo, xem, sửa, lưu trữ lớp và đổi mã tham gia (#241).
- [x] **3.9** API thành viên lớp: tham gia bằng mã, rời lớp, giáo viên xem và xoá thành viên, học sinh xem lớp đã tham gia (#243).
- [x] **3.4** Quyền xem bộ từ có `visibility = CLASS` (#265).
- [x] **3.5** API giáo viên giao bộ từ cho lớp kèm chế độ và hạn nộp, xem và huỷ bài giao (#267).
- [x] **3.10** API học sinh xem bài cần làm của các lớp đã tham gia, kèm trạng thái đã làm, chưa làm, quá hạn.
- [x] **3.6** API kết quả theo lớp và theo học sinh: số liệu cả lớp của bài giao, kết quả từng học sinh, kết quả một học sinh qua các bài giao.
- [x] **3.11** Lệnh `npm run user:set-role -w @vocab/api -- <email> <vai trò>` gán ADMIN, TEACHER hoặc STUDENT để test và cấp quyền tạm khi chưa chốt việc 3.2 (#283).
- [x] **3.7a** Web giáo viên quản lý lớp: mục "Lớp học" trên menu cho TEACHER và ADMIN, danh sách lớp đang dạy và đã lưu trữ, tạo lớp, trang lớp có mã tham gia lớn (sao chép, đổi mã), danh sách học sinh, xoá học sinh, lưu trữ và mở lại lớp.
- [x] **3.7b** Web giáo viên giao bài: trong trang lớp chọn bộ từ, chế độ, hạn nộp; xem và huỷ bài đã giao.
- [x] **3.7c** Web giáo viên xem kết quả: bấm bài đã giao mở trang kết quả có số liệu cả lớp (đã làm, quá hạn, điểm trung bình), 5 từ cả lớp hay sai, bảng kết quả từng học sinh.
- [x] **3.7d** Trang kết quả của một học sinh qua các bài giao, mở từ tên học sinh ở trang lớp và trang kết quả; API `GET /classes/:id/members/:userId` trả tên học sinh.
- [x] **3.8** Web cho học sinh trong lớp: mục "Lớp học" cho mọi người, tham gia bằng mã, "Bài cần làm" kèm trạng thái mở thẳng chế độ học, "Lớp đã tham gia" và rời lớp.

## Giai đoạn 4: Luyện nói và offline

**Xong khi:** học sinh luyện nói được và tiếp tục học khi mất mạng.

- [x] **4.1** Nền chế độ luyện nói: enum `SPEAK`, strategy và API (#190).
- [x] **4.4** Giao diện luyện nói: xin quyền micro, nhận dạng giọng nói, thử lại, bỏ qua (#192).
- [x] **4.2** PWA: manifest, cài lên thiết bị, cache giao diện (#226).
- [x] **4.3** Tải bộ từ về máy (IndexedDB), xem thẻ ở trang offline, xoá dữ liệu offline khi đăng xuất (#228).
- [x] **4.5** Học Flashcard khi mất mạng với bộ đã tải, phiên đã xong vào hàng đợi trên máy; service worker lưu sẵn mã của trang offline (#231).
- [x] **4.6** Gửi hàng đợi phiên học offline lên máy chủ khi có mạng và đã đăng nhập (#233).

## Giai đoạn 5: Vai trò, lớp học và độ gọn

**Xong khi:** mỗi vai trò có Tổng quan riêng trả lời đúng câu hỏi của mình; giáo viên giao bài nhiều chế độ, học sinh làm và nộp bài, giáo viên theo dõi từng em; form ngắn mở trong modal, danh sách dài có phân trang, chữ dài không phá bố cục. Phân tích và thiết kế ở `docs/use-cases/06-vai-tro-va-lop-hoc.md` (góp ý ngày 2026-11-20), làm theo skill `ui-ux-pro`.

### 5A. Sửa lỗi

- [x] **5.1** Mục "Đăng xuất" kẹt ở "Đang đăng xuất" sau khi đăng nhập lại: đặt lại state khi người dùng đổi, test đăng xuất rồi đăng nhập lại (GAP-14, #317).
- [x] **5.2** Luyện nói: nút micro tròn, trạng thái "Đang nghe… hãy đọc to từ" có hiệu ứng toả nhẹ (tắt khi giảm chuyển động), nút Dừng, `aria-live` (GAP-15, #319).
- [x] **5.37** Đăng nhập Google trên mobile kẹt màn hình trắng: popup của Google mở sang tab hoặc trình duyệt khác (PWA đã cài, Zalo, Messenger) nên mất `window.opener`. Màn hình cảm ứng và PWA chuyển sang `ux_mode: 'redirect'`, Google POST về `POST /auth/google/redirect`, API kiểm tra `nonce` với cookie rồi chuyển về `/login?google=done`, web refresh lấy phiên và đi tiếp tới `?next=`. Cần thêm Authorized redirect URI trên Google Cloud (docs/08-deploy.md). (#413)

### 5B. Nền giao diện

- [x] **5.3** `FormDialog` dùng chung với `ConfirmDialog` (focus, Esc hỏi lại khi đã nhập, lỗi trong modal, toàn màn hình ở 360 px); ghi quy tắc "form ngắn trong modal" vào `docs/05-ui-tokens.md` (GAP-21, #321).
- [x] **5.4** `DateTimeField` tiếng Việt: `dd/mm/yyyy`, giờ 24 tiếng, màu theo token, nút nhanh Hết hôm nay, Ngày mai, 1 tuần; thay `datetime-local` (GAP-22, #323, #325).
- [x] **5.5** Chống tràn chữ toàn site: `min-w-0`, `break-words`, cắt dòng cho tên và mô tả ở thẻ, hàng, header; test chuỗi 120 ký tự không dấu cách ở 360 px (GAP-25, #326).
- [x] **5.6** Thẻ bộ từ gọn hơn: cao khoảng 112 px, mô tả 1 dòng, lưới 4 cột từ 1280 px; cập nhật mục "Thẻ bộ từ" trong `docs/05-ui-tokens.md` (GAP-24, #328).
- [x] **5.7** Phân trang cho các danh sách còn tải hết: bài đã giao (`?apage=`), lớp đã tham gia (`?cpage=`), thẻ trên trang bộ từ và trang công khai (50 thẻ, nút bấm); "Bài cần làm" và kết quả một học sinh chuyển sang 5.12, 5.15 vì đang sắp xếp và tính tổng ở trình duyệt (GAP-26, #330).
- [x] **5.8** Chuyển form còn chèn trong trang sang modal: tạo lớp, tham gia lớp (#332), tạo và đổi tên thư mục, khoá tài khoản, ẩn bộ từ (#333). Sửa tên, mô tả lớp làm ở 5.16 (GAP-21).

### 5C. Tài khoản

- [x] **5.9** Thiết kế lại trang Tài khoản: thẻ hồ sơ bên trái, nhóm Hồ sơ, Bảo mật, Giọng đọc, Vùng nguy hiểm dạng hàng; đổi tên và mật khẩu qua modal; tài khoản Google ghi "Đăng nhập bằng Google". Cần 5.3 (GAP-23, #335).

### 5D. Giao bài và nộp bài

- [x] **5.10** Schema: `Assignment.modes`, `StudySession.assignmentId`, bảng `AssignmentSubmission`, backfill bài cũ và bài nộp từ phiên đã xong; cập nhật `docs/02-database.md` (GAP-17, #337).
- [x] **5.11** API giao bài nhiều chế độ (1 đến 5, kiểm tra chế độ dùng được với bộ); giao bộ riêng tư cần `shareToClass` và đổi bộ sang `CLASS` trong cùng transaction. Cần 5.10 (GAP-17, GAP-18, #339).
- [x] **5.12** API làm và nộp bài: phiên học nhận `assignmentId`, `GET /classes/assignments/:id`, `POST /classes/assignments/:id/submit`, tính đúng hạn, trễ, bỏ lỡ và điểm; danh sách bài cần làm trả trạng thái mới, sắp xếp theo trạng thái ở API và phân trang trên web. Cần 5.10. Đã có phần xem bài, nộp bài và phiên gắn bài (#341); còn trạng thái mới trong danh sách bài cần làm.
- [x] **5.13** Web modal giao bài: chọn bộ có tìm kiếm, chọn và sắp thứ tự chế độ (mặc định lộ trình đề xuất), cảnh báo bộ riêng tư, `DateTimeField`. Cần 5.3, 5.4, 5.11 (#344).
- [x] **5.14** Web học sinh làm bài: trang bài tập có danh sách chế độ và nút "Tiếp tục", phiên học mang `?assignment=`, màn kết quả về bài tập hoặc chế độ tiếp, nút Nộp bài có xác nhận, trạng thái Đã nộp hoặc Nộp trễ. Cần 5.12 (#346).

### 5E. Giáo viên theo dõi lớp

- [x] **5.15** API số liệu học sinh trong lớp: đúng hạn, trễ, bỏ lỡ, đang chờ, điểm trung bình, hoạt động gần nhất; sắp xếp và tìm theo tên; số liệu tóm tắt ở API để trang kết quả một học sinh phân trang được. Cần 5.12 (GAP-19, #360).
- [x] **5.16a** Danh sách lớp của giáo viên dạng thẻ hàng: ô chữ cái đầu, tên, mô tả 1 dòng, số học sinh, số bài đang mở, tỉ lệ nộp đúng hạn 30 ngày, mã lớp kèm nút sao chép; API `GET /classes` trả thêm `openAssignmentCount`, `onTimeRate`. Cần 5.15 (GAP-20, #364).
- [x] **5.16b** Trang lớp gọn: mã lớp thành chip có nút sao chép, modal "Mời học sinh" (mã lớn, sao chép, đổi mã), menu "⋯" (sửa tên và mô tả trong modal, đổi mã, lưu trữ), tab Bài tập và Học sinh trong URL (`?tab=`). Cần 5.8 (GAP-20, #366).
- [x] **5.16c** Tab Học sinh: bảng Tên, Vào lớp, Đúng hạn, Trễ, Bỏ lỡ, Điểm TB từ API 5.15, tìm và sắp theo tên, phân trang 20, thẻ 2 dòng ở 360 px; bấm hàng mở modal hồ sơ học sinh (4 ô số liệu, 5 bài gần đây, "Xem tất cả bài", "Xoá khỏi lớp"). Cần 5.15, 5.16b (GAP-19, #368).
- [x] **5.17** Trang kết quả bài giao theo bài nộp: trạng thái 5 loại, điểm theo từng chế độ, lọc theo trạng thái. Cần 5.12 (#370).

### 5F. Tổng quan theo vai trò

- [x] **5.18** Tổng quan học sinh: khối "Bài tập lớp" đầu trang (bỏ lỡ, hạn gần nhất, tối đa 3), ẩn khi chưa vào lớp. Cần 5.12 (GAP-16, #373).
- [x] **5.19** API `GET /teacher/overview`: ô số liệu, cần chú ý, sắp đến hạn, bài vừa nộp. Cần 5.15 (#375).
- [x] **5.20** Tổng quan giáo viên theo thiết kế: nút chính Giao bài (modal có chọn lớp), trạng thái trống 3 bước, phần học cá nhân thu gọn. Cần 5.13, 5.19 (GAP-16, #379).
- [x] **5.21** API thống kê ADMIN mở rộng: người hoạt động 7 ngày, đăng ký mới, phiên học, phân bố vai trò, chuỗi 30 ngày, bộ công khai mới để rà (GAP-16, #377).
- [x] **5.22** Tổng quan ADMIN theo thiết kế: 4 ô số liệu, biểu đồ 30 ngày, Cần xử lý, Vai trò, Người dùng mới, Bộ công khai mới có nút Ẩn. Cần 5.21 (GAP-16, #380).
- [x] **5.23** E2E: giáo viên giao bài 3 chế độ từ bộ riêng tư, học sinh làm và nộp, giáo viên thấy ở Tổng quan và modal hồ sơ; audit accessibility các trang mới ở light, dark, 360 px (#382).

### 5G. Trải nghiệm học và độ gọn của form

- [x] **5.24** Âm thanh khi trả lời đúng ở mọi chế độ học trừ Kiểm tra, tạo bằng Web Audio, bật tắt ở Tài khoản (mặc định bật); use case UC-L12 trong `docs/use-cases/03-hoc-tap.md`. (#348).
- [x] **5.25** `Combobox` dùng chung có tìm kiếm ngay trong ô chọn (mẫu ARIA combobox, lọc không dấu); thay ô chọn bộ và bỏ ô "Tìm bộ từ" riêng ở modal giao bài, thay hai ô ngôn ngữ ở form bộ từ; dùng cho ô chọn lớp ở 5.20; ghi quy tắc vào `docs/05-ui-tokens.md` (GAP-27, #352).
- [x] **5.26** `FormDialog` rộng hơn (cỡ `md` 560 px, `lg` 720 px cho giao bài), cao theo nội dung ở mọi kích thước; ở 360 px là tấm đáy cao theo nội dung thay vì toàn màn hình; cập nhật `docs/05-ui-tokens.md` (GAP-28, #350).
- [x] **5.27** Giao bài chọn được từ 1 đến tất cả chế độ dùng được với bộ (bỏ `MAX_ASSIGNMENT_MODES = 5`), nút "Chọn tất cả" và "Bỏ chọn" trong modal; cập nhật `docs/03-api.md` (GAP-29, #354).
- [x] **5.28** Ôn hôm nay chọn một, nhiều hoặc tất cả chế độ, các phiên chạy nối tiếp như lộ trình, bỏ qua chế độ không dùng được, lưu lựa chọn trên thiết bị; UC-L10 trong `docs/use-cases/03-hoc-tap.md` (GAP-29, #358).

### 5H. Danh sách lớn và thư mục trên mobile

Thiết kế ở mục "5a. Danh sách lớn" của `docs/use-cases/06-vai-tro-va-lop-hoc.md` (góp ý ngày 2026-11-21).

- [x] **5.29** `ListPanel` và `ListToolbar` dùng chung: khung, tiêu đề kèm tổng số, tab trạng thái, ô tìm co giãn, ô lọc và sắp xếp, chân "1–20 trên N" kèm phân trang, 4 trạng thái trong khung, "Xoá bộ lọc"; áp vào tab Học sinh (sửa ô tìm co lại); ghi quy tắc vào `docs/05-ui-tokens.md` (GAP-31, GAP-33, #385).
- [x] **5.30** API lọc bài cần làm của học sinh: `group` (`todo`, `done`, `all`), `classId`, `q` theo tên bộ, `sort` (`due`, `-createdAt`) kèm số lượng từng nhóm; `GET /classes/joined` nhận `q` (GAP-32, #387).
- [x] **5.31** Web học sinh `/classes`: khung Bài tập có tab Cần làm, Đã nộp, Tất cả, lọc lớp, tìm, sắp xếp; khung Lớp đã tham gia có tìm và phân trang; `AssignmentRow` dùng chung. Cần 5.29, 5.30 (GAP-31, GAP-32). (#391)
- [x] **5.32** Bài đã giao của giáo viên: API `status` (`open`, `closed`, `all`), `q`, `sort`, số đã nộp x/y; tab Bài tập dùng `ListPanel` và `AssignmentRow` cùng kiểu với học sinh. Cần 5.29, 5.31 (GAP-32). (#393)
- [x] **5.33** Lớp đang dạy: API `GET /classes` nhận `q`, `sort` (`-createdAt`, `name`, `-memberCount`); web dùng `ListPanel` có tìm, sắp xếp, phân trang. Cần 5.29 (GAP-33). (#395)
- [x] **5.34** Thư mục trên mobile: nút "Thư mục: <tên>" mở tấm đáy chọn thư mục (tìm, tạo mới); "⋯ > Chuyển vào thư mục" thay kéo thả trên màn hình cảm ứng; ô tìm và nút sắp xếp chung hàng (GAP-34). (#397)
- [x] **5.35** Trang Quản lý người dùng đồng bộ với các danh sách khác: nút quay lại Tổng quan, `ListPanel` có tab trạng thái (Tất cả, Đang hoạt động, Đã khoá), tìm, lọc vai trò, sắp xếp, chân "1–20 trên N" kèm phân trang; API `GET /admin/users` nhận `role`, `status`. Cần 5.29 (#405, #406).
- [x] **5.36** Sửa lỗi layout trên mobile 360 px và chống nhảy layout khi chọn chế độ ôn tập trên cả PC lẫn mobile (GAP-35): nhãn Bottom Nav 1 dòng ở cả 2 ngôn ngữ ("Review" / "Ôn tập"); thanh tìm kiếm và sắp xếp trang Bộ từ gọn gàng; ô chọn trong `ListToolbar` ở Quản lý người dùng không gãy chữ làm lệch hàng; ẩn tay nắm kéo thả bộ từ trên mobile; khối tóm tắt Ôn hôm nay gọn và không nhảy dòng khi chọn/nhả chế độ ôn trên mọi thiết bị. Cần 5.28, 5.29, 5.34, 5.35, 6.7. (#409)

## Giai đoạn 6: Đa ngôn ngữ

**Xong khi:** mọi màn đổi được giữa tiếng Việt và tiếng Anh, lựa chọn được nhớ, không còn chữ viết cứng. Thiết kế ở `docs/adr/0003-da-ngon-ngu-bang-i18next.md`, use case ở `docs/use-cases/07-da-ngon-ngu.md`.

- [x] **6.1** Nền i18next: `i18next`, `react-i18next`, file `locales/vi` và `locales/en`, cookie `vocab.locale`, `getT` cho server và `I18nProvider` cho client, `<html lang>`, nút đổi ngôn ngữ ở header và Tài khoản, khoá có kiểu, test hai bộ khoá giống nhau; quy tắc "không viết cứng chuỗi giao diện" trong `docs/06-conventions.md` (GAP-30). (#399)
- [x] **6.2a** Thông báo lỗi theo `ERROR_CODES` ở namespace `errors` (đủ 47 mã, hai ngôn ngữ) và lỗi mạng; `formErrorMessage` dịch theo ngôn ngữ đang dùng. Tách từ 6.2 vì 6.2 quá 400 dòng. (#401)
- [x] **6.2b** Zod schema trong shared dùng khoá dịch (khoảng 80 thông báo ở `schemas/*` và `import/template.ts`), form và lỗi `details` từ API dịch theo khoá. Cần 6.2a.
- [x] **6.2c** Toast (khoảng 47 chỗ trong 21 file) và hộp xác nhận (13 file) dùng `t()`. Cần 6.2a.
- [x] **6.3** Dịch trang giới thiệu, đăng nhập, đăng ký, quên mật khẩu, trang công khai, Khám phá và metadata. Cần 6.1.
- [x] **6.4** Dịch khung app, Tổng quan, Bộ từ, thư mục, trình soạn, nhập từ. Cần 6.1.
- [x] **6.5** Dịch các chế độ học, lộ trình, Ôn hôm nay, thống kê, offline. Cần 6.1.
- [x] **6.6** Dịch lớp học, bài tập, Tài khoản, quản trị. Cần 6.1.
- [x] **6.7** Ngày giờ và số theo ngôn ngữ, script báo chữ tiếng Việt viết cứng trong `.tsx` chạy cùng `npm run lint`, E2E đổi ngôn ngữ và audit ở cả hai ngôn ngữ. Cần 6.2 đến 6.6.
- [x] **6.8** Tinh chỉnh UX xác thực, đa ngôn ngữ, thẻ thống kê 3 vai trò và ôn nối tiếp nhiều chế độ (GAP-36, UC-I5, UC-L10). Một PR gồm: header trang xác thực gom nút ngôn ngữ và theme về bên phải; lỗi xác thực và Google Sign-in giữ lỗi gốc rồi dịch lại theo ngôn ngữ đang chọn, kể cả khi đổi ngôn ngữ sau khi lỗi hiện ra; `toLocale` nhận cả `en-US`, `vi-VN`; `html lang` cập nhật theo sự kiện `languageChanged`; `translate="no"` chặn Google Dịch sửa DOM làm React lỗi; bỏ `<script>` trong `LocaleRoot` (cảnh báo Turbopack); dịch chữ "Xem" viết cứng ở việc cần làm của admin; thẻ thống kê 3 vai trò theo mục "Thẻ thống kê" ở `docs/05-ui-tokens.md`, màu icon chỉ dùng token; gọn khối Ôn hôm nay; ôn nhiều chế độ có thanh bước `ReviewSteps`, lưu tập thẻ và chuỗi chế độ trong `sessionStorage`, đọc chuỗi sau hydrate để không lệch HTML, mỗi chế độ là một phiên mới nhờ `key`, chế độ cuối báo hoàn thành và xoá dữ liệu đã lưu. (#415)
- [x] **6.9** Chip chọn chế độ ở Ôn hôm nay (`ReviewModePicker`) và các nút tương tự đạt vùng bấm 44 px mà khối tóm tắt vẫn gọn ở 360 px: chip giữ 36 px, lớp `::after` nới vùng bấm; nút "Ôn bộ đầu tiên" và "Chọn tất cả" cao 44 px; bỏ chữ đậm khi chọn để chip không đổi bề rộng. Phát hiện khi review 6.8. (#415)
- [x] **6.10** Tích hợp tìm ảnh minh hoạ trực tuyến đa nguồn (Unsplash & Pixabay) cho bộ thẻ: cấu hình API keys cho backend, tìm kiếm và phân trang kết quả ảnh bản quyền miễn phí; tích hợp `ImageSearchDialog` dùng chung vào cả form tạo/sửa thẻ (`CardImageField`) và bảng xem trước khi nhập từ file (`ImportPreview`) kèm khung cuộn `max-h-[60dvh]`; thiết kế lại danh sách thẻ trang chi tiết bộ từ thành bố cục 1 hàng ngang cân đối (`[Từ vựng + Phiên âm] | [Định nghĩa + Ví dụ] | [Ảnh]`).
- [x] **6.11** Nâng cấp thị giác các chế độ học và đại tu chế độ Kiểm tra (Test mode) theo chuẩn `frontend-design`:
  - **Đồng bộ khối thẻ câu hỏi (Unified Question Card)**: Bọc toàn bộ các yếu tố của câu hỏi (ảnh minh hoạ căn giữa cân đối, từ/nghĩa, loa phát âm, ô nhập liệu/lựa chọn và phản hồi đúng sai) vào trong 1 khối thẻ duy nhất (`rounded-2xl border bg-surface p-6 sm:p-8 shadow-sm`) xuyên suốt tất cả các chế độ học: Luyện viết (`write`), Điền từ (`cloze`), Luyện nói (`speak`), Trắc nghiệm (`mcq`), Ghép cặp (`match`), Kiểm tra (`test`) và Thẻ ghi nhớ (`flashcard`).
  - **Thiết kế lại chế độ Kiểm tra (`test`)**: Nâng `TEST_ROUND_SIZE` lên 100 câu; gắn ảnh minh hoạ cân đối như các chế độ khác; bảng số câu hỏi (Question palette) ở đầu trang giúp theo dõi tiến độ và nhảy mượt (smooth scroll) đến câu bất kỳ; tách từng câu hỏi thành card độc lập có badge phân loại; các ô đáp án trắc nghiệm dạng thẻ A, B, C, D cao cấp; thanh nộp bài cố định chân trang (sticky action bar).
  - **Dàn đều chiều cao lưới chế độ học (`StudyModeGrid`)**: Thêm `auto-rows-fr`, `h-full w-full min-h-[84px]` giúp 9 thẻ chế độ học luôn thẳng hàng tăm tắp, không bị lệch chiều cao giữa các hàng/cột khi đổi sang tiếng Anh.
  - **Chuẩn hoá bo góc và đổ bóng (`globals.css`)**: Bổ sung đầy đủ thang đo `--radius-*` và `--shadow-*` cho Tailwind v4; căn chỉnh độ bo góc vừa phải, thanh lịch (8px cho input/button/select/textarea, 12px cho ảnh/card con, 14px cho khung lớn).
  - **Chuẩn hoá kiến trúc**: Xoá file re-export thừa `apps/web/src/features/sets/components/image-search-dialog.tsx`, chuyển test sang `components/common/image-search-dialog.test.tsx` và trỏ trực tiếp toàn bộ import về `@/components/common/image-search-dialog`.
- [x] **6.12** Cân đối banner ôn tập và rút gọn tên menu (#419): Cân đối banner Ôn hôm nay (`due-sets.tsx`), phóng to số thẻ cần ôn và tăng độ nổi bật; rút gọn tên hiển thị trên header menu (`account-menu.tsx`) tránh tràn layout ở mọi kích thước màn hình.
- [x] **6.13** Đồng bộ thiết kế bảng, bộ lọc và phân trang cho chi tiết học sinh và chi tiết bài giao (#420):
  - Bảng danh sách bài đã giao của học sinh tại `/classes/:id/members/:userId` dùng `ListPanel`, bộ lọc trạng thái (Tất cả, Đã nộp, Chưa làm, Quá hạn), tìm kiếm theo tên bài, sắp xếp và phân trang `Pagination`.
  - Bảng kết quả từng học sinh tại `/classes/:id/assignments/:assignmentId` dùng `ListPanel`, bộ lọc trạng thái (Tất cả, Đã nộp, Chưa làm, Nộp trễ, Quá hạn), tìm kiếm học sinh, sắp xếp và phân trang.
- [x] **6.14** Đồng bộ Import xem trước, kéo thả toàn thẻ, menu ngữ cảnh chuột phải và phân quyền Admin (#421):
  - **Đồng bộ Import xem trước với form Tạo bộ từ**: Bỏ bảng tĩnh cũ, tích hợp form tạo bộ từ (`SetEditor`) đầy đủ tính năng: danh sách thẻ có thể sửa/xoá/thêm trực tiếp, cuộn riêng, tìm ảnh minh hoạ trực tuyến, giao diện chuẩn chỉ.
  - **Tối ưu mặc định Import**: Lược bỏ trường chọn ngôn ngữ (mặc định từ là `en`, nghĩa là `vi` cho app học tiếng Anh); cấu hình sẵn cách đọc 4 cột: `Từ \t Nghĩa \t Phiên âm \t Ví dụ`; cập nhật placeholder form dán.
  - **Menu ngữ cảnh chuột phải (`ContextMenu`)**: Tích hợp trên desktop cho thẻ bộ từ ở cả Thư viện (`/sets`) và Khám phá (`/explore`); trên mobile hiển thị nút ba chấm ⋯.
  - **Tạo bộ từ theo ngữ cảnh thư mục (`?folder=...`)**: Đang đứng ở thư mục nào thì tạo bộ hoặc import sẽ tự động gán vào thư mục đó, huỷ quay lại đúng thư mục.
  - **Kéo thả toàn bộ thẻ (Whole-card Drag & Drop)**: Kéo cả thẻ thả vào thư mục trên cột thư mục; bỏ nút thư mục bị trùng lặp.
  - **Bộ lọc Khám phá & Quyền Admin**: Bộ lọc sắp xếp và tìm kiếm trên Khám phá; menu chuột phải có chức năng Ẩn bộ từ cho Admin khi xem bộ của người khác.
- [x] **6.15** Hoàn thiện UX bộ từ (sticky header, public/private toggle, luồng Khám phá liền mạch, đồng bộ khung danh sách) và học offline đa chế độ:
  - **Ghim thanh menu (Sticky Header)**: Cố định header điều hướng trên cùng khi cuộn trang (`sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur-sm`) ở cả layout ứng dụng `(app)` và trang công khai `(public)`.
  - **Luồng Khám phá liền mạch (Explore Journey Continuity)**:
    - Khi xem bộ từ từ Khám phá (`/sets/:id?from=explore`), thanh điều hướng `AppNav` giữ active mục **Khám phá** (không bị nhảy sang mục "Bộ từ"), nút quay lại trên đầu trang trỏ về `/explore`.
    - Khi bấm "Bắt đầu học" hoặc chọn bất kỳ chế độ học nào trong lưới `StudyModeGrid`, cờ `?from=explore` được truyền tiếp xuyên suốt vào trang học đơn lẻ và lộ trình `StudyPath`.
    - Tại màn hình kết quả học (`StudyResult`), thay nút "Về bộ từ" dễ gây hiểu lầm thành nút **"Trở về"** (`exitLabel = t('result.return')`), đưa người học quay lại đúng trang bộ từ ở Khám phá (`/sets/:id?from=explore`), từ đó có thể học tiếp chế độ khác hoặc nhấn `< Quay lại Khám phá`.
  - **Gọn gàng trang chi tiết bộ từ**: Chuyển "Sao chép liên kết" vào menu ba chấm, gỡ nút độc lập trên hàng thông tin.
  - **Phân định Public ↔ Private và Ẩn bộ từ**: Bộ từ của chính mình hiển thị nút và menu chuyển trạng thái Công khai ↔ Riêng tư (`ToggleVisibilityButton`); nút "Ẩn bộ từ" của Admin chỉ hiển thị khi kiểm duyệt bộ từ của người khác.
  - **Đồng bộ khung danh sách quản lý (`ListPanel`)**: Vùng thân danh sách có chiều cao tối thiểu và tối đa (`min-h-[260px] max-h-[calc(100dvh-280px)] overflow-y-auto`), toolbar và phân trang giữ cố định để người dùng không phải cuộn tràn cả trang khi danh sách dài.
  - **Học offline đa chế độ & Chống đơ giao diện**:
    - Bổ sung nút "Chọn chế độ" trên trang `/offline` mở hộp thoại chọn 9 chế độ học ngoại tuyến (Flashcard, Học kỹ, Luyện viết, Nghe viết, Trắc nghiệm, Điền từ, Ghép cặp, Kiểm tra, Luyện nói), lưu kết quả vào IndexedDB để tự động đồng bộ khi có mạng.
    - Sửa triệt để lỗi đơ giao diện khi bấm "Về bộ từ": trang `/offline` hỗ trợ callback `onExit` cho `StudyShell` và `StudyResult` để đóng giao diện học và quay lại danh sách ngoại tuyến sạch sẽ mà không bị kẹt lại màn hình kết quả do router Next.js trùng URL.
- [x] **6.16** Trung tâm Quản trị hệ thống (Admin Management Hub), phân cấp Dashboard theo vai trò, quản lý bộ từ công khai & kiểm duyệt, cấu trúc Lớp học theo giáo viên và khoá học sinh chưa có lớp:
  - **Phân cấp Dashboard cho ADMIN (Role-based Dashboard Hierarchy)**: Đưa `AdminOverview` lên vị trí trên cùng; nút dẫn sang khu vực quản trị dịch chuẩn là **"Trang quản lý"** (`manageUsers`). Bên dưới là thẻ thu gọn/mở rộng trực quan, nổi bật (`details/summary`) mang icon Mũ tốt nghiệp và tiêu đề "Giao diện Giáo viên & Học sinh", có chú thích rõ ràng kèm chevron quay chỉ dẫn giúp người dùng dễ dàng nhận biết bấm mở để xem tổng quan lớp đang dạy (`TeacherOverview`), bài tập (`ClassWork`), thống kê cá nhân (`StatsOverview`) và các bộ từ gần đây (`RecentSets`).
  - **Sửa lỗi tràn bố cục menu thao tác trên mobile (Mobile Menu Layout Overflow Fix)**: Thay thế submenu ngang (`MenuSubContent`) trong nút ba chấm của thẻ bộ từ (`SetCardActionsDropdown`) bằng hộp thoại chọn thư mục `MoveToFolderDialog` dạng tấm đáy (`layout="sheet"`), loại bỏ triệt để tình trạng submenu bay ngang sang trái bị cắt mép màn hình trên thiết bị di động (< 640px).
  - **Thanh tab điều hướng Quản trị hợp nhất (`AdminNavTabs`)**: Đồng bộ 3 tab quản trị trực quan với đầy đủ icon và trạng thái active: Người dùng (`/admin/users`), Bộ từ công khai (`/admin/hidden-sets`), Lớp học & Học sinh (`/admin/classes`).
  - **Quản lý Bộ từ công khai & Kiểm duyệt nội dung (`/admin/hidden-sets`)**:
    - Backend: Bổ sung endpoint `GET /admin/sets` hỗ trợ lọc theo trạng thái (`status: all | visible | hidden`), tìm kiếm theo tên bộ từ hoặc tác giả (`q`), phân trang `limit/page`. Giữ endpoint `GET /admin/sets/hidden` để tương thích ngược.
    - Web: Giao diện `ListPanel` với 3 tab lọc trạng thái (Tất cả, Đang hiển thị, Bị ẩn), ô tìm kiếm `ListToolbar`, badge trạng thái màu sắc rõ ràng (Đang hiển thị - xanh lá, Bị ẩn - đỏ kèm lý do), thông tin tác giả, số thẻ và ngày cập nhật; tích hợp nút hành động trực tiếp: "Ẩn bộ từ" (mở `FormDialog` nhập lý do) và "Bỏ ẩn" (khôi phục tức thì).
  - **Quản lý Lớp học theo Giáo viên & Học sinh chưa có lớp (`/admin/classes`)**:
    - Backend: Endpoint `GET /admin/classes/overview` phân cấp dữ liệu cao nhất theo danh sách **Giáo viên** (`teachers: AdminTeacherItem[]`), mỗi giáo viên chứa danh sách các lớp học phụ trách (`classes`) và học sinh trong từng lớp (`members`); đồng thời bổ sung thông tin trạng thái khoá (`lockedAt`, `lockReason`) cho danh sách học sinh chưa có lớp (`unassignedStudents`).
    - Web:
      - 3 thẻ thống kê tổng quan (Tổng số lớp, Học sinh trong lớp, Học sinh chưa có lớp).
      - Bảng **Toàn bộ lớp học theo giáo viên**: Phân cấp Giáo viên -> Lớp học -> Học sinh. Mỗi giáo viên hiển thị avatar, tên, email, tổng số lớp, tổng số học sinh; mở rộng xem từng lớp học (tên lớp, mã tham gia, số học sinh, số bài tập); mở rộng tiếp bên trong lớp để xem danh sách học sinh tham gia (tên, email, ngày tham gia); hỗ trợ tìm kiếm giáo viên/lớp học và phân trang `Pagination`.
      - Bảng **Học sinh chưa tham gia lớp học nào**: Tab lọc trạng thái (Tất cả, Đang hoạt động, Đã khoá), tìm kiếm học sinh theo tên/email, phân trang `Pagination`; hiển thị badge trạng thái; cung cấp hành động **Khoá tài khoản** qua `LockDialog` (với lý do mặc định _"Không xác định được danh tính"_) và nút **Mở khoá** trực tiếp.
  - **Đồng bộ toàn bộ bảng danh sách quản trị (`ListPanel`)**: Toàn bộ bảng danh sách người dùng, bộ từ công khai, giáo viên & lớp học, học sinh chưa có lớp đều tuân thủ kích thước tối thiểu và tối đa chuẩn (`min-h-[260px] max-h-[calc(100dvh-280px)] overflow-y-auto`), toolbar tìm kiếm/lọc cố định trên đầu và phân trang `Pagination` / `ListPager` cố định dưới chân.
  - **Tối ưu kích thước cột, cỡ chữ & Cuộn ngang an toàn (`AdminClasses`)**:
    - Chuẩn hóa layout bảng dạng Grid có tiêu đề cột rõ ràng và cột Thao tác (Action) căn phải, bọc trong container `overflow-x-auto` với chiều rộng tối thiểu chuẩn (`min-w-[700px]`) giúp bảng không bao giờ bị co rúm, méo mó trên màn hình nhỏ.
    - Cân đối tỷ lệ các cột và áp dụng `whitespace-nowrap` tuyệt đối cho các nút hành động ("Thu gọn", "Xem học sinh", "Khoá", "Mở khoá") và badge trạng thái (`• Đang hoạt động`, `• Đã khoá`, `Lưu trữ`), loại bỏ hoàn toàn hiện tượng chữ bị bẻ thành 2 dòng.
    - Kéo dài thanh tìm kiếm ngập khung (`w-full`) kèm menu Select sắp xếp cho cả bảng Giáo viên và Học sinh chưa có lớp.
  - **Tách component Bảng dùng chung (`DataTable`) & Chuẩn hóa tiêu đề bảng toàn bộ trang Quản trị**:
    - Xây dựng component bảng tái sử dụng `DataTable` (`DataTableContainer`, `DataTableHeader`, `DataTableRow`, `DataTableCell` tại `@/components/common/data-table`), đóng gói sẵn tính năng cuộn ngang an toàn, layout CSS Grid thẳng hàng từng cột, typography tiêu đề in hoa chuẩn chỉnh và hover effect.
    - Cân đối lại tỷ lệ cột cho bảng Giáo viên, bảng con Lớp học và Học sinh chưa có lớp: điều chỉnh cột Tên không còn chiếm quá nhiều khoảng trống mênh mông, tăng chiều rộng cột Bài tập kèm `whitespace-nowrap`, triệt tiêu hoàn toàn lỗi rớt chữ (`ASSIGNMENT\nS`).
    - Chuẩn hóa tiêu đề bảng (Table Header) cho cả **Quản lý người dùng** (`NGƯỜI DÙNG`, `TRẠNG THÁI`, `VAI TRÒ`, `THAO TÁC`) và **Quản lý bộ từ công khai** (`BỘ TỪ`, `TÁC GIẢ`, `THỜI GIAN`, `TRẠNG THÁI`, `THAO TÁC`), các cột dữ liệu và hành động được phân chia rành mạch, ngay ngắn.
    - **Badge vai trò (`RoleBadge`) & Cụm Action trực quan có icon**:
      - Cột Vai trò chuyển sang hiển thị `RoleBadge` thanh lịch với icon nhận diện đặc trưng: `ShieldCheck` (Quản trị), `GraduationCap` (Giáo viên), `User` (Học sinh).
      - Đưa ô `Select` đổi vai trò sang nằm trong cột Thao tác (Action) cạnh nút Khoá/Mở khoá, giữ cột thẳng hàng ngay ngắn.
      - Bổ sung icon trực quan cho toàn bộ nút thao tác trong các bảng quản trị: `Lock` (Khoá), `Unlock` (Mở khoá), `EyeOff` (Ẩn bộ từ), `Eye` (Bỏ ẩn), `School` (Xem lớp học), `Users` (Xem học sinh).
    - **Đồng bộ phân trang (Pagination & Range Display) 100%**: Nâng cấp `ListPager` hỗ trợ callback `onPageChange` cho client-side pagination; giúp bảng Giáo viên và Học sinh chưa có lớp luôn hiển thị dải số `1–2 trên 2`, `1–4 trên 4` ở chân bảng đồng bộ như Người dùng và Bộ từ công khai, tự động bật nút chuyển trang khi vượt kích thước phân trang.
  - **Hệ thống Tooltip & Truncate đồng bộ toàn diện trên toàn bộ website**:
    - Đồng bộ hiển thị văn bản dài với cơ chế dấu chấm lửng (`truncate`) và tooltip native (`title={...}`) cho tất cả các màn hình danh sách: Quản lý người dùng (`AdminUsers`), Quản lý bộ từ công khai (`AdminHiddenSets`), Quản lý Lớp học & Học sinh (`AdminClasses`), Danh sách thành viên lớp (`ClassMembers`), Dòng bài tập (`AssignmentRow`), và Thẻ bộ từ chung (`SetCardShell`, `SetCardGrid`). Khi tên người dùng, email, tiêu đề bộ từ, mô tả lớp học hay lý do khoá/ẩn quá dài, giao diện giữ nguyên sự gọn gàng và người dùng có thể rê chuột để đọc trọn vẹn thông tin.
  - **Khối Card bo viền & Nâng cấp Thẩm mỹ Khung Thư mục, Tạo bộ từ & Import danh sách từ**:
    - **Khối Thư mục (`FolderPanel`)**: Bao bọc toàn bộ cột danh sách thư mục bên trái trang `/sets` trong một khối thẻ (`rounded-lg border border-border-strong bg-surface p-4 shadow-sm`), tạo điểm nhấn nổi bật, tách bạch rõ ràng giữa khối Thư mục và danh sách Bộ từ.
    - **Khối Tạo & Sửa bộ từ (`SetForm`, `CardFields`)**: Bọc vùng thông tin cơ bản bộ từ (`SetDetailsFields`) và từng thẻ từ vựng (`CardFields`) thành các khối card bo viền (`rounded-lg border border-border-strong bg-surface p-4/p-5 shadow-sm`), giúp giao diện tạo/sửa thẻ từ vựng trực quan, ngăn nắp.
    - **Khối Nhập từ file (`ImportSource`)**: Bọc từng bước quy trình nhập từ file (Bước 1: Lấy file mẫu, Bước 2: Đưa danh sách vào, Bước 3: Kiểm tra cách đọc) thành từng thẻ card bo viền độc lập (`rounded-lg border border-border-strong bg-surface p-5 shadow-sm`).
  - **Bộ lọc Phạm vi hiển thị cho Bộ từ (`MySets`)**:
    - Bổ sung bộ lọc phạm vi hiển thị (`visibility: PRIVATE | PUBLIC | CLASS`) tại trang Bộ từ của tôi (`/sets`), hỗ trợ đồng thời cả backend query (`findByOwner`) và query params URL (`?visibility=`), đồng bộ dropdown "Lọc phạm vi" (Tất cả phạm vi, Bộ riêng tư, Bộ công khai, Bộ cho lớp học) bên cạnh thanh tìm kiếm và menu sắp xếp.
  - **Đồng bộ Table cho Menu Lớp học của Giáo viên & Học sinh (`TeacherClasses`, `StudentClasses`)**:
    - **Giáo viên (`TeacherClasses`)**: Chuẩn hóa danh sách lớp sang component `DataTable` dùng chung (`DataTableContainer minWidth="min-w-[720px]"`), đầy đủ dòng tiêu đề cột in hoa (`TÊN LỚP`, `HỌC SINH`, `BÀI ĐANG MỞ`, `TỶ LỆ ĐÚNG HẠN`, `MÃ THAM GIA / THAO TÁC`), avatar chữ cái đầu, tên lớp link trực tiếp, thanh meter tỷ lệ nộp đúng hạn và cụm sao chép mã lớp.
    - **Học sinh (`StudentClasses`)**: Chuẩn hóa bảng Lớp đã tham gia (`JoinedClasses`) sang dạng `DataTable` (`LỚP HỌC`, `GIÁO VIÊN`, `THAO TÁC`), hiển thị rõ ràng tên giáo viên phụ trách và nút thao tác Rời lớp (`Button` variant="ghost" có icon `LogOut`).
  - **Trải nghiệm Menu, Mã lớp, Header & Responsive Mobile toàn diện**:
    - **Trạng thái Menu nổi bật (`AppNav`)**: Chuyển trạng thái active của menu chính từ chỉ đổi màu chữ sang nền pill nổi bật `bg-primary-soft`, chữ tím đậm `text-primary`, `font-semibold` và đổ bóng nhẹ trên desktop, bo góc mềm mại trên mobile.
    - **Cụm Sao chép Mã lớp độc lập (`JoinCodeBadge`)**: Tách mã lớp thành component nút tương tác riêng (`relative z-20`, `e.stopPropagation()`, `e.preventDefault()`, viền `border-primary/25`, nền `bg-primary-soft`, hover chuyển màu primary rõ rệt, đổi icon `Copy` -> `Check` khi sao chép kèm toast thông báo), loại bỏ triệt để hiện tượng hover/click nhầm vào link chuyển tới trang chi tiết lớp học.
    - **Icon trực quan cho nút tạo & nhập**: Bổ sung icon `FileUp` cho nút "Nhập từ file" và `Plus` cho nút "Tạo bộ từ" tại trang Bộ từ `/sets`, đồng bộ nhận diện với nút "+ Tạo lớp".
    - **Chuẩn hóa Header & Cỡ chữ Tiêu đề**: Thu gọn padding `PageHeader` và `AdminOverview` mỏng nhẹ (`px-4 py-2.5 sm:px-5 sm:py-3.5`); lấy cỡ tiêu đề Quản trị làm chuẩn và tăng lên 1 size cân đối (`text-xl sm:text-[1.65rem] font-bold tracking-tight leading-tight`), áp dụng thống nhất cho toàn bộ các trang.
    - **Menu hành động 3 chấm & Tối ưu Sticky trên Mobile**:
      - Sửa lỗi thanh menu chính bị dính đỉnh trang trên mobile (`relative md:sticky md:top-0`), giúp cuộn trang mượt mà tự nhiên trên điện thoại và chỉ sticky trên màn hình máy tính.
      - Trên mobile, các nút hành động của `PageHeader` tự động thu gọn vào nút 3 chấm (`MoreVertical`), mở `Menu` dropdown trực quan và `PageHeader` sticky ở `top-2` trên mobile giúp người dùng dễ dàng thao tác nhanh bất kể vị trí cuộn trang.
    - **Đồng bộ Bảng Kết quả Học sinh (`AssignmentResults` & `MemberResults`)**: Di chuyển toàn bộ bảng kết quả sang hệ thống `DataTableContainer`, định nghĩa grid template cố định (`RESULT_GRID`, `MEMBER_RESULT_GRID`), giải quyết triệt để lỗi tính toán độ rộng cột khiến tiêu đề bảng và dữ liệu dòng bị lệch nhau.
    - **Đóng khung Cài đặt Ngôn ngữ, Chi tiết Lớp học & Đồng bộ Khung Header**:
      - Sửa lỗi thanh menu sticky che khuất thẻ tóm tắt người dùng bên trái trang Cài đặt (`AccountSettings`) bằng cách nâng offset từ `top-6` lên `lg:top-20` (80px), đảm bảo khoảng thở 16px phía dưới thanh điều hướng khi cuộn.
      - Đóng khung phần **Ngôn ngữ** (`LanguageSettings`) thành khối thẻ chuẩn (`rounded-lg border border-border bg-surface p-4 sm:p-5 shadow-2xs`), đồng bộ hoàn toàn với các phần Mật khẩu, Phiên đăng nhập và Giọng đọc.
      - Đóng khung tiêu đề lớp học (`ClassHeader` trong `/classes/[id]`) thành card bo viền chuẩn (`rounded-lg border border-border-strong bg-surface px-4 py-2.5 sm:px-5 sm:py-3.5 shadow-sm`), đồng bộ cỡ chữ tiêu đề tên lớp (`text-xl sm:text-[1.65rem] font-bold`) và đường kẻ ngăn cách thông tin thành viên / mã lớp.
      - Đồng bộ kích thước font và padding cho khung chi tiết bộ từ (`SetDetail`) và chi tiết bài giao (`PageHeader` trong `AssignmentResults`).
  - **Đóng khung Chế độ học, Danh sách Từ vựng & Tối ưu UI Chi tiết Bộ từ (`/sets/[id]`)**:
    - **Khung Chọn cách học (`StudyModeGrid`)**: Bao bọc toàn bộ 9 chế độ học trong khung card kính mờ chuẩn (`rounded-xl border border-border-strong/70 bg-surface/80 p-4 sm:p-5 shadow-2xs backdrop-blur-sm`).
    - **Khung Từ vựng trong bộ (`CardList`)**: Bao bọc toàn bộ danh sách thẻ từ trong khung card kính mờ chuẩn, bổ sung tiêu đề rõ ràng `Thẻ (số lượng)`, dải phân trang và phân cách thẻ bằng `divide-y divide-border`.
    - **Tiến độ học 3 thẻ stat nhỏ (`SetProgressSummary`)**: Chuyển đổi 3 chỉ số _"Đã thuộc"_, _"Đang học"_, _"Chưa học"_ thành 3 thẻ stat nhỏ gọn vừa khít **1 hàng trên mobile** (`grid-cols-3 gap-2`) và dãn đều trên PC, bao bọc trong khung kính mờ kèm phần giải thích bên dưới.
    - **Cân đối Nút Thao tác trên Mobile (`SetOwnerActions`)**: Sắp xếp lưới `grid-cols-[1fr_1fr_auto]` chia đều 50/50 cho nút "Sửa" và "Công khai / Riêng tư", nút ba chấm góc phải, nằm trên **1 dòng duy nhất**, không rớt dòng.
  - **Tối ưu Danh sách Chế độ học trong Bảng Kết quả (`AssignmentResults`)**:
    - Khi giáo viên giao nhiều chế độ học (4-9 chế độ), cụm điểm từng chế độ được đưa vào container cuộn ngang mượt mà (`overflow-x-auto whitespace-nowrap scrollbar-thin`), các badge giữ `shrink-0` giúp chiều cao các dòng dữ liệu luôn đồng đều, không bị phình to làm vỡ layout.
  - **Căn chỉnh Nút Thao tác trong Bảng Dashboard Quản trị (`AdminOverview`)**:
    - Sửa lỗi nút "Ẩn" (`HideSetButton`) trong danh sách "Bộ công khai mới" bị rớt dòng và kéo dãn 100% chiều rộng trên màn hình nhỏ; chuyển sang layout `flex items-center justify-between` với tiêu đề thu gọn `truncate` và nút căn phải gọn gàng (`className="w-auto"`).
- [x] **6.17** Tối ưu hóa Sticky Header chuẩn UX, Sticky Table Header toàn hệ thống, Debounce tìm kiếm, Cân đối chế độ học và Tối ưu Responsive di động (#425):
  - **Tối ưu Sticky Header chuẩn UX trên Mobile**:
    - Header chính (`layout.tsx`): Chuyển thành `sticky top-0 z-20` trên cả mobile lẫn desktop để người dùng luôn truy cập được Logo, Đổi ngôn ngữ, Đổi Theme và Menu tài khoản.
    - Tiêu đề trang (`page-header.tsx`): Bỏ thuộc tính `sticky top-2 sm:static` trên mobile, để tiêu đề cuộn tự nhiên cùng nội dung, tránh chiếm dụng không gian màn hình dọc khi đã có Bottom Navigation ở đáy.
  - **Ghim tiêu đề bảng dữ liệu (Sticky Table Header) toàn hệ thống (`DataTableHeader`)**:
    - Toàn bộ tiêu đề cột của mọi bảng dữ liệu (`DataTableHeader`) được cấu hình `sticky top-0 z-10 bg-surface`, ghim cố định ngay ở đỉnh khung cuộn dữ liệu của `ListPanel`.
    - Áp dụng cấu hình cuộn `overflow-x-auto` trên `DataTableContainer`, vừa đảm bảo cuộn ngang an toàn trên màn hình hẹp vừa cho phép sticky header bám chắc ở đỉnh khi cuộn dọc danh sách.
  - **Tìm kiếm tức thì với Debounce 300ms & Tối ưu thanh công cụ (`SetSearchForm`, `ListToolbar`)**:
    - Bỏ nút tím "Tìm kiếm" submit thủ công, tích hợp debounce 300ms tự động lọc khi gõ phím và phản hồi ngay lập tức khi ấn Enter.
    - Mở rộng thanh tìm kiếm tràn hết phần dư (`flex-1 min-w-0`), thêm icon kính lúp bên trong (`pl-9`).
    - Khắc phục lỗi chữ bị đè lên dropdown "Mới cập nhật" / "Recently updated" bằng cách căn chỉnh độ rộng tối thiểu và `shrink-0`.
  - **Cuộn ngang chống rớt dòng cho các tab lọc (`ListToolbar`, `AdminClasses`, `ClassDetail`)**:
    - Bổ sung tiện ích `.no-scrollbar` trong `globals.css` và áp dụng `overflow-x-auto no-scrollbar py-0.5 sm:flex-wrap` kèm `shrink-0 whitespace-nowrap` cho danh sách tab lọc trên toàn bộ các bảng quản trị và chi tiết lớp học, giải quyết dứt điểm hiện tượng các tab bị rớt dòng lộn xộn trên màn hình nhỏ.
  - **Cân đối chế độ học & Đưa TEST, SPEAK vào Ôn tập**:
    - Bộ chọn chế độ ôn tập (`ReviewModePicker` trong `due-sets.tsx`): Phân bổ 3 chế độ/hàng trên PC (`md:grid-cols-3`) và 2 chế độ/hàng trên mobile (`grid-cols-2`).
    - Bổ sung 2 chế độ `TEST` (Kiểm tra) và `SPEAK` (Luyện nói) vào chuỗi ôn tập `REVIEW_MODES` (tổng cộng đủ 9 chế độ học).
    - Lưới kỹ năng trang chi tiết bộ từ (`StudyModeGrid`): Điều chỉnh hiển thị **1 hàng** trên mobile (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`), loại bỏ hoàn toàn hiện tượng bẻ đôi từ ngữ ("Flashca\nrd").
  - **Đồng bộ chia đôi bộ lọc trang Bộ từ trên Mobile (`MySets`)**:
    - Gộp 2 dropdown "Phạm vi hiển thị" và "Sắp xếp" vào container `grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3`, chia đôi 50/50 trên một hàng ngang ở mobile thay vì chiếm 2 hàng dọc.
  - **Khắc phục lỗi Responsive cụm nút thao tác chi tiết bộ từ (`SetOwnerActions`, `ToggleVisibilityButton`)**:
    - Chuẩn hóa đồng bộ chiều cao 36px (`h-9`), padding `px-2.5 sm:px-3`, kích thước chữ `text-small` và `whitespace-nowrap`, `truncate` cho nút "Sửa", nút "Công khai / Riêng tư" và nút ba chấm (`size-9`), xóa bỏ hoàn toàn hiện tượng nút bị kéo to thô kệch và vỡ chữ ("Công \n khai").
  - **Chuẩn hóa nút Sao chép mã lớp dùng chung (`JoinCodeBadge`)**:
    - Tách component độc lập `JoinCodeBadge` và đồng bộ 100% style pill bo góc tím nhạt (`bg-primary-soft`, `text-primary`, icon `Copy` -> `Check` khi sao chép kèm toast) giữa bảng giáo viên bên ngoài (`TeacherClasses`) và trang chi tiết lớp học bên trong (`ClassDetail`).
  - **Sửa lỗi Điều hướng khi bấm vào bộ từ ở trang Ôn tập**:
    - Sửa `href` thẻ bộ từ trong `due-sets.tsx` trỏ trực tiếp đến `reviewHref(setId, modes)` thay vì trang quản lý bộ từ.
    - Cập nhật `AppNav` hỗ trợ nhận diện ngữ cảnh Ôn tập (`fromReview`: `?from=review`, `?due=...`, `?review=...`), đảm bảo tab "Ôn tập" luôn giữ trạng thái active trên navbar trong suốt phiên ôn thẻ và nút quay lại hiển thị "Quay lại Ôn tập".
  - **Khắc phục chồng đè cột bảng lớp học giáo viên (`TeacherClasses`)**:
    - Tinh chỉnh lại template `TEACHER_CLASS_GRID` và container `minWidth="min-w-[800px]"`, xử lý `truncate` và `whitespace-nowrap` hợp lý.
  - **Khắc phục lỗi mất loa phát âm trên các dòng máy Android (Vivo/Oppo/Xiaomi/Webview) & Hệ thống Hybrid Speech Fallback**:
    - Khắc phục triệt để lỗi nút loa (`AudioButton`) bị ẩn hoàn toàn (`return null`) trên các dòng điện thoại không tích hợp sẵn Web Speech API (như Vivo Y35, trình duyệt Vivo Browser, Zalo in-app webview, Facebook webview).
    - Nâng cấp `isSpeechSupported()` hỗ trợ nhận diện cả Web Speech API lẫn HTML5 Audio, đảm bảo biểu tượng loa phát âm luôn luôn hiển thị 100% trên mọi thiết bị và trình duyệt.
    - Xây dựng cơ chế phát âm kép Hybrid Speech: ưu tiên giọng đọc native Web Speech API (S23 Ultra, Chrome PC, iOS Safari), và tự động kích hoạt Audio fallback qua HTML5 Audio khi trình duyệt không có Web Speech hoặc thiết bị Android thiếu gói giọng đọc Google TTS.
    - Tích hợp cơ chế watchdog 1.2s tự động phát hiện và chuyển sang Audio fallback nếu engine TTS trên điện thoại bị treo hoặc không phản hồi.
- [x] **6.18** Tối ưu nhận diện giọng nói Luyện nói, Modal cảnh báo trình duyệt, Trộn thẻ ngẫu nhiên mặc định và Tối ưu nút chi tiết bộ từ trên Mobile (#426):
  - **Tối ưu nhận diện giọng nói Luyện nói (`SpeakMode`, `gradeSpokenText`, `speech-recognition.ts`)**:
    - Chuẩn hoá mã ngôn ngữ nhận diện có vùng BCP-47 (`en-US` / `en-GB` theo cài đặt người dùng) thay vì mã chung `en`, giúp kích hoạt chính xác acoustic model tiếng Anh trên Chrome Android và các thiết bị di động.
    - Mở rộng `MAX_ALTERNATIVES = 10` để tiếp nhận đầy đủ các phương án nhận diện giọng nói từ Google Speech Engine.
    - Xây dựng thuật toán chấm điểm âm học `gradeSpokenText`:
      - Tự động bóc tách dấu chấm câu cuối câu (`. , ! ?`) do Web Speech API tự gán.
      - Xử lý mạo từ và cụm từ ("an apple", "the cat" cho từ đích "apple", "cat").
      - Tách các phương án trích xuất từ ngoặc đơn và gạch chéo ("autumn (fall)" -> "autumn", "fall"; "(to) swim" -> "swim", "to swim"; "cinema / movie theater").
      - Áp dụng khoảng cách Damerau-Levenshtein hỗ trợ hoán vị ký tự liền kề và dung sai ngữ âm (theatre/theater, colour/color, pronunciation/pronounciation) nhưng vẫn phân biệt rạch ròi số ít và số nhiều (apple vs apples).
  - **Modal cảnh báo trình duyệt không hỗ trợ Nhận diện giọng nói (`UnsupportedSpeechDialog`, `speak-mode.tsx`)**:
    - Nút micro luyện nói luôn luôn hiển thị trực quan trên giao diện ngay cả khi trình duyệt không hỗ trợ Web Speech Recognition.
    - Bấm vào nút micro trên trình duyệt không hỗ trợ (Vivo Browser, Zalo / Facebook WebView...) sẽ mở modal thông báo chi tiết, kèm danh sách các trình duyệt khuyên dùng: Google Chrome (tốt nhất), Microsoft Edge, Samsung Internet, Apple Safari (iOS 14.5+), và hướng dẫn mở link ra trình duyệt ngoài khi dùng Zalo/Facebook.
  - **Trộn thẻ ngẫu nhiên mặc định & Nút chuyển đổi thứ tự gốc (`ShuffleToggle`, `session.store`)**:
    - Thiết lập chế độ trộn thẻ ngẫu nhiên (`shuffle: true`) làm mặc định cho toàn bộ 9 chế độ học (Flashcard, Học kỹ, Ghép thẻ, Trắc nghiệm, Tự luận, Điền từ, Nghe viết, Luyện nói, Kiểm tra).
    - Tích hợp nút `ShuffleToggle` ngay trên thanh tiến độ của khung học (`StudyFrame`), hiển thị icon `Shuffle` kèm highlight khi đang trộn ngẫu nhiên (mặc định) và icon `ListOrdered` khi tắt để học theo thứ tự từ vựng gốc cho học sinh mới/học sinh yếu.
    - Ghi nhớ trạng thái vào `localStorage` (`vocab.study.shuffle`) và cho phép chuyển đổi mượt mà giữa ngẫu nhiên và thứ tự gốc bất kỳ lúc nào trong phiên học.
  - **Tối ưu khoảng cách nút và nhãn Học Offline trên Mobile (`SetDetailScreen`, `OfflineToggle`)**:
    - Khắc phục triệt để lỗi 2 nút "Sao chép bộ từ" và "Tải về máy" bị dính sát sạt vào nhau trên màn hình di động bằng container `flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto`.
    - Đổi nhãn nút từ "Tải về máy" thành **"Tải về học offline"** ngắn gọn, dễ hiểu ngay tính năng tải về để học khi mất mạng mà không bị dài dòng, kèm tooltip giải thích chi tiết.
- [x] **6.19** Quản lý trạng thái Online/Offline và các bộ từ học gần đây của người dùng cho Quản trị viên, khắc phục dứt điểm rớt dòng nút Đăng nhập Header và tự động kích hoạt Modal trình duyệt không hỗ trợ micro:
  - **Khắc phục lỗi rớt dòng nút Đăng nhập trên Mobile Header (`button.tsx`, `session-link.tsx`, `(public)/layout.tsx`, `marketing-shell.tsx`)**:
    - Cấu hình `whitespace-nowrap` trực tiếp vào `buttonVariants` của `Button` toàn hệ thống, ngăn chặn vỡ chữ 2 hàng ("Đăng \n nhập") trên màn hình hẹp (<= 360 px).
    - Thêm `shrink-0`, padding và gap co giãn linh hoạt (`px-2.5 sm:px-4`, `gap-1 sm:gap-2`) cho thanh điều hướng trên mobile.
  - **Khắc phục triệt để hiển thị Modal không hỗ trợ giọng nói trên Android / In-App WebView (`speech-recognition.ts`, `speak-mode.tsx`)**:
    - Mở rộng nhận diện User-Agent phát hiện các trình duyệt di động OEM và WebView nhúng không có Google Speech Service backend (`VivoBrowser`, `vivo`, `Zalo`, `FBAN`, `FBAV`, `Instagram`, `HeyTapBrowser`, `MiuiBrowser`).
    - Bắt lỗi runtime `service-not-allowed`, `language-not-supported`, `audio-capture` và ngoại lệ khởi tạo đồng bộ, tự động chuyển sang trạng thái `unsupported` và mở ngay modal hướng dẫn trình duyệt.
    - Dùng `useSyncExternalStore` để xác định năng lực trình duyệt phía client theo chuẩn React 19, tránh lỗi cascading render effect, kèm đường link "Xem danh sách trình duyệt được hỗ trợ" khi có lỗi nhận diện.
  - **Theo dõi trạng thái Online/Offline người dùng trong Quản trị (`UserPresenceService`, `AuthGuard`, `AdminUsersRepository`, `adminUserSchema`)**:
    - Xây dựng `UserPresenceService` ghi nhận mốc thời gian hoạt động cuối cùng (`lastActiveAt`) của người dùng khi gửi yêu cầu xác thực qua `AuthGuard`.
    - Định nghĩa người dùng Online khi có hoạt động trong vòng 15 phút gần nhất; hiển thị chấm tròn chỉ báo màu xanh/xám trên Avatar và badge Online/Offline bên cạnh trạng thái tài khoản.
    - Bổ sung tab lọc "Đang online" (`status=online`) trên thanh công cụ quản lý người dùng.
  - **Xem nhanh những bộ từ học gần đây của người dùng (`RecentStudySetsDialog`, `AdminUsersRepository`)**:
    - Backend truy vấn các phiên học (`studySessions`) gần nhất của từng người dùng, gộp các bộ từ đã học kèm thông tin: tên bộ từ, chế độ học (Flashcard, Trắc nghiệm, Luyện viết...), số câu đúng/tổng số câu (%) và thời gian học.
    - Cung cấp nút xem "X bộ gần đây" trên từng dòng người dùng trong bảng Quản trị, mở hộp thoại chi tiết `RecentStudySetsDialog` với link trực tiếp đến bộ từ.
- [x] **6.20** Loại bỏ cài đặt tốc độ đọc trong Cài đặt tài khoản và chuyển đổi trực tiếp trên khung học & các chế độ học:
  - **Loại bỏ lựa chọn tốc độ đọc trong Cài đặt tài khoản (`SpeechSettings`)**:
    - Xoá bỏ ô chọn `speech.rate` ("Bình thường" / "Chậm") khỏi trang Cài đặt tài khoản/Setup, giúp tinh giản giao diện cài đặt và tránh việc người học phải rời phiên học để vào Cài đặt đổi tốc độ phát âm.
  - **Tích hợp nút chuyển tốc độ đọc trực tiếp trên thanh điều khiển phiên học (`StudyFrame`, `SpeechRateToggle`)**:
    - Bổ sung nút `SpeechRateToggle` trên thanh công cụ của `StudyFrame` (ngay cạnh nút `ShuffleToggle`), hiển thị tốc độ hiện tại (`1.0x` / `0.8x`) kèm nhãn trạng thái và icon trực quan (`Volume2` cho bình thường, `Snail` cho đọc chậm).
    - Hỗ trợ đổi nhanh giữa 1.0x và 0.8x bằng một chạm, đồng bộ tức thì vào `localStorage` qua sự kiện `vocab:speech-settings-changed` và thông báo toast cho người dùng.
    - Mọi lần phát âm tự động và thủ công trong phiên học ngay lập tức áp dụng tốc độ đọc vừa chọn trên cả Web Speech API lẫn Audio fallback.
  - **Tích hợp nút nghe chậm trực tiếp trên câu hỏi của các chế độ học (`AudioButton`)**:
    - Kích hoạt `withSlow` cho `AudioButton` trên tất cả các chế độ học (Flashcard, Trắc nghiệm, Tự luận, Luyện nói, Kiểm tra, Nghe viết), cung cấp icon ốc sên bên cạnh loa để nghe chậm ngay tại chỗ mà không cần thao tác chuyển đổi chung.

## Giai đoạn 7: Động lực học tập và trò chơi

**Xong khi:** học sinh có lý do quay lại mỗi ngày (XP, mục tiêu ngày, chuỗi có thẻ giữ chuỗi, huy hiệu), thấy mình đứng ở đâu so với cả app và cả lớp, được nhắc trước khi mất chuỗi qua Web Push hoặc mail mà không tốn phí dịch vụ, và có chế độ trò chơi Mưa từ. Use case ở `docs/use-cases/08-dong-luc-va-tro-choi.md`. Không thêm tab mới vào thanh điều hướng: các khối mới nằm ở Tổng quan, Tài khoản và trang lớp.

### 7A. XP, cấp độ và mục tiêu ngày

- [x] **7.1** Nền XP: bảng `XpEvent` (người dùng, số XP, nguồn, phiên học, thời điểm) và cột `User.dailyGoalXp` (mặc định 20); quy tắc tính trong `@vocab/shared` (`study/xp.ts`): đúng +10, ôn thẻ đến hạn đúng +5, mỗi 5 câu đúng liên tiếp +5, không cộng lại thẻ đã đúng trong 10 phút, trần 500 XP mỗi ngày, bảng cấp độ; server cộng XP khi lưu mỗi lô đáp án trong cùng transaction và trả `xpEarned`, phiên offline gửi lên cũng được tính; `GET /stats/xp` (tổng, cấp, XP hôm nay, mục tiêu); ngày tính theo giờ Việt Nam. Cập nhật `docs/02-database.md`, `docs/03-api.md` (UC-G1).
- [x] **7.2** Giao diện XP: khối XP và cấp độ trên Tổng quan, vòng tròn mục tiêu ngày, đủ mục tiêu thì hiện "Hoàn thành hôm nay"; chọn mục tiêu 10, 20 hoặc 50 XP ở Tài khoản (`PUT /stats/xp/goal`); màn kết quả hiện XP vừa nhận và hiệu ứng lên cấp (tắt khi giảm chuyển động). Cần 7.1 (UC-G1).

### 7B. Chuỗi và thẻ giữ chuỗi

- [x] **7.3** Thẻ giữ chuỗi: mỗi thứ Hai được 1 thẻ, giữ tối đa 2; bỏ lỡ đúng 1 ngày thì tự dùng thẻ, ngày đó tính là giữ chuỗi; bảng `StreakFreezeDay` ghi ngày đã dùng, cấp và dùng thẻ khi mở Tổng quan hoặc gửi đáp án (không cần cron); `GET /stats/overview` trả số thẻ còn và các ngày đã dùng; Tổng quan hiện ❄️ trên lịch 7 ngày, số thẻ còn ở ô Chuỗi ngày và thông báo khi đã dùng thẻ hôm qua. Cần 7.1 (UC-G2).

### 7C. Huy hiệu

- [x] **7.4** Huy hiệu: danh sách và điều kiện trong `@vocab/shared` (ví dụ 100 từ đã thuộc, chuỗi 7 và 30 ngày, Kiểm tra 100%, học 10 bộ, đạt mục tiêu ngày 7 lần, cú đêm học sau 23h), bảng `UserBadge` (khoá duy nhất người dùng và mã huy hiệu), xét khi kết thúc phiên và trả `newBadges`, `GET /stats/badges`; danh sách huy hiệu dạng dòng ở Tài khoản (đã có và chưa có kèm điều kiện và tiến độ), thông báo khi nhận ở màn kết quả. Cần 7.1 (UC-G3).

### 7D. Bảng xếp hạng

- [x] **7.5** API xếp hạng tuần: `GET /leaderboard?week=current|previous` và `GET /leaderboard/classes/:id` trả top 50 theo XP tuần (thứ Hai 00:00 giờ Việt Nam) kèm hạng của tôi; cột `User.hideFromLeaderboard` và `Class.leaderboardEnabled` (mặc định bật); xếp hạng lớp chỉ cho thành viên và giáo viên của lớp (lọc ngay trong truy vấn, người ngoài nhận 404); `PUT /leaderboard/visibility`; chỉ trả tên hiển thị. Cần 7.1 (UC-G4).
- [x] **7.6** Giao diện xếp hạng: khối "Xếp hạng tuần" trên Tổng quan (top 3 và hạng của tôi) có link tới trang `/leaderboard` (tab Toàn app và từng lớp đã tham gia, xem tuần trước); tab "Xếp hạng" ở trang lớp, công tắc bật tắt cho giáo viên; công tắc "Ẩn tôi khỏi bảng xếp hạng chung" ở Tài khoản. Cần 7.5 (UC-G4).

### 7E. Nhắc học miễn phí

- [x] **7.13** Chuông thông báo trong app: bảng `Notification` (người nhận, loại, dữ liệu JSON, đường dẫn mở, `readAt`), API `GET /notifications` (phân trang, mới nhất trước), `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `POST /notifications/read-all`; tạo thông báo khi giáo viên giao bài cho lớp (mỗi học sinh một thông báo), khi nhận huy hiệu, khi dùng thẻ giữ chuỗi; job 7.7 thêm thông báo "Đến giờ ôn tập" và "Bài tập sắp hết hạn"; nút chuông trên header cạnh ảnh đại diện có số chưa đọc, bấm mở danh sách (menu nổi dùng lại `Menu`, ở 360 px gần đủ chiều rộng màn hình), bấm thông báo thì đánh dấu đã đọc và mở đúng trang; tự làm mới mỗi 60 giây và khi quay lại tab; xoá thông báo cũ quá 90 ngày. Làm trước 7.7 (UC-G7).
- [x] **7.7** Nền job hằng ngày: `POST /internal/jobs/daily-reminders` là `@Public` nhưng bắt buộc header `X-Job-Secret` khớp `JOBS_SECRET` (so sánh an toàn thời gian); GitHub Actions chạy theo lịch 13:00 UTC (20:00 giờ Việt Nam) gọi endpoint, đồng thời đánh thức Render gói Free; bảng `ReminderLog` (khoá duy nhất người dùng, loại, ngày hoặc bài) để chạy lại không gửi trùng; tạo thông báo `REVIEW_DUE` và `ASSIGNMENT_DUE` vào chuông; chọn người cần nhắc: chuỗi từ 3 ngày mà hôm nay chưa học, có từ 10 thẻ đến hạn, bài tập hết hạn trong 24 giờ mà chưa nộp. Thêm biến vào `.env.example`, `env.ts`, `docs/08-deploy.md` (UC-G5).
- [x] **7.8** Web Push: khoá `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (thiếu thì tắt tính năng), bảng `PushSubscription`, `GET /push/config`, `POST /push/subscriptions` và `/push/subscriptions/remove`, gửi bằng thư viện `web-push`, xoá đăng ký khi dịch vụ đẩy trả 404 hoặc 410; service worker xử lý `push` và `notificationclick` mở đúng trang (Ôn hôm nay, bài tập); thẻ "Bật nhắc học mỗi tối?" ở Tổng quan chỉ hiện khi đã có XP (đã học ít nhất một phiên), chỉ hỏi quyền khi người học tự bấm; công tắc thiết bị này ở nhóm Thông báo của Tài khoản; hướng dẫn riêng cho iPhone (thêm vào màn hình chính, iOS 16.4+). Cần 7.7 (UC-G5).
- [x] **7.9** Mail nhắc qua Brevo free: tối đa 1 mail mỗi người mỗi ngày gộp các nội dung nhắc, chỉ gửi mail chuỗi và thẻ đến hạn cho người chưa có Web Push hoạt động, bài tập sắp hết hạn luôn gửi; đếm mail đã gửi trong ngày, giữ 50 mail cho quên mật khẩu, quá hạn mức thì bỏ loại ưu tiên thấp (thứ tự: bài tập, chuỗi, thẻ đến hạn); mẫu mail hai ngôn ngữ theo ngôn ngữ của người dùng, có link huỷ nhận ký bằng token. Cần 7.7 (UC-G5).
- [x] **7.10** Cài đặt thông báo: nhóm "Thông báo" ở Tài khoản bật tắt từng loại (chuỗi, ôn tập, bài tập) theo từng kênh (Web Push, mail), trạng thái quyền của trình duyệt và nút gửi thử; trang huỷ nhận mở từ link trong mail không cần đăng nhập. Cần 7.8, 7.9 (UC-G5).
- [x] **7.26** Job nhắc học không nhắc sai giờ khi lịch GitHub Actions chạy trễ: nhắc chuỗi và ôn chỉ chạy từ 18:00 đến trước 23:00 giờ Việt Nam (`DAILY_REMINDER_HOURS`), gọi ngoài khung thì bỏ qua và không ghi `ReminderLog` để lần gọi đúng giờ vẫn nhắc; nhắc bài tập sắp hết hạn chạy mọi lúc (#449). Trước đó lịch 20:00 ngày 27/11 chạy lúc 04:51 sáng hôm sau.
- [x] **7.27** Thiết kế lại mail theo giao diện Liquid Glass của web: khung chung `mail-layout.ts` có logo thật (`apps/web/public/mail/logo.png` xuất từ `LogoMark` và chữ Literata), nền `--bg` có quầng sáng, thẻ kính viền sáng, mỗi việc là một ô kính có biểu tượng và con số nổi bật (giờ còn lại, số ngày chuỗi, số thẻ), nút nhuộm màu chính có vệt sáng; màu chép từ token (`MAIL_COLORS`), bố cục bảng và style inline cho Gmail, Outlook, điện thoại. Câu chữ mỗi phần có ba cách nói đổi theo ngày và theo người; mail đặt lại mật khẩu dùng cùng khung.
- [x] **7.28** Sửa thưởng combo XP: server chỉ đọc 5 câu gần nhất nên chuỗi 7 câu đúng bị đếm thành 5 và thưởng câu thứ 10 tới muộn; nay đọc lại tối đa 100 câu.
- [x] **7.29** XP dễ hiểu hơn: mục tiêu ngày đổi sang 50 / 100 / 200 / 300 XP (khoảng 5, 10, 20, 30 câu đúng, mặc định 100, migration chuyển người cũ theo bậc), mỗi lựa chọn ghi số câu đúng tương ứng; phần "Cách tính XP" ở Tài khoản giải thích luật cộng XP, combo, trần ngày, lên cấp và mục tiêu kèm ví dụ (số liệu lấy từ `XP_RULES`); thẻ hồ sơ ở Tài khoản hiện cấp độ, tổng XP và thanh lên cấp; link ở Tổng quan đổi thành "Mục tiêu và cách tính XP".
- [x] **7.30** Chặn cày XP bằng Xem thẻ: chế độ tự chấm (`selfGraded` trên strategy, hiện là Xem thẻ) chỉ được `XP_RULES.selfGraded` = 2 XP mỗi thẻ "Biết rồi", không có thưởng thẻ đến hạn, không tính vào chuỗi combo; bấm dưới `selfGradedMinMs` = 1,5 giây thì không có XP. Lịch ôn của thẻ không đổi. Phần "Cách tính XP" có thêm dòng giải thích.

### 7F. Chế độ Mưa từ

- [x] **7.11** Strategy và API cho chế độ Mưa từ (`WORD_RAIN`): enum mới, đăng ký trong registry của `@vocab/shared`, chấm đáp án theo hai kiểu chơi `TYPE` (gõ, bỏ dấu cách thừa, không phân biệt hoa thường, kết quả như chế độ Viết) và `SPEAK` (nói, chấm như chế độ Luyện nói), kết quả cập nhật `CardProgress` và XP; bảng `GameHighScore` (người dùng, bộ, chế độ, kiểu chơi, điểm, đợt cao nhất, điểm cao tính riêng từng kiểu chơi), `GET /sets/:id/word-rain/high-score` và `POST /study/sessions/:id/word-rain/score` sau khi kết thúc phiên; đáp án nói mang tiền tố `spoken:`; bộ cần ít nhất 4 thẻ; giao bài cho lớp dùng được chế độ này. Theo skill `study-mode` (UC-G6).
- [x] **7.12a** Lõi trò chơi Mưa từ (hàm thuần `features/study/modes/word-rain/engine.ts`, có unit test): vòng lặp `requestAnimationFrame` theo thời gian thực, sinh "mục tiêu" mang nghĩa rơi từ trên xuống, gõ chữ đầu thì khoá mục tiêu khớp gần đáy nhất, gõ đúng từng ký tự thì bắn, gõ đủ thì nổ, gõ sai thì mất combo; 3 khiên, mục tiêu chạm đáy mất 1 khiên; đợt 10 mục tiêu, tốc độ và mật độ tăng dần theo đợt; cuối mỗi 3 đợt có mục tiêu lớn là từ dài nhất trong bộ, cần gõ 2 lần; combo nhân điểm x2, x3, x4; tạm dừng bằng `Esc` hoặc khi rời tab; từ rơi trùng nhau không quá 2 lần một đợt. Cần 7.11 (UC-G6).
- [x] **7.12b** Đồ hoạ chiến đấu cơ hiện đại: vẽ bằng canvas hoặc SVG theo design token (đọc màu từ biến CSS, đúng light và dark): chiến đấu cơ cánh tam giác nhìn từ dưới lên, buồng lái kính phản sáng, hai động cơ phun lửa có hạt, máy bay xoay mũi về mục tiêu đang khoá; mục tiêu là drone địch mang thẻ nghĩa, chữ đã gõ đổi màu; đạn laser theo từng ký tự, nổ bằng hạt và sóng xung kích, rung màn nhẹ; nền trời đêm nhiều lớp chuyển động thị sai (sao, mây, thành phố mờ); HUD: điểm, combo, khiên, đợt, điểm cao nhất; âm thanh bắn và nổ bằng Web Audio theo công tắc âm thanh có sẵn; giảm chuyển động thì tắt rung, giảm hạt và thị sai; giữ 60 fps trên điện thoại tầm trung, tự giảm hiệu ứng khi tụt khung hình. Cần 7.12a (UC-G6).
- [x] **7.12d** Kiểu chơi Nói cho Mưa từ: dùng lại `lib/speech-recognition.ts` của Luyện nói, nghe liên tục kèm kết quả tạm, nói đúng từ của bất kỳ mục tiêu nào đang rơi thì bắn mục tiêu gần đáy nhất có từ đó (không cần khoá trước), chấp nhận lệch nhẹ theo quy tắc chấm của Luyện nói; bong bóng hiện chữ vừa nghe được, chỉ báo micro đang nghe; đường tốc độ chậm hơn kiểu gõ để bù độ trễ nhận dạng; chỉ xin quyền micro khi chọn kiểu Nói; trình duyệt không hỗ trợ thì ẩn kiểu Nói và mở modal hướng dẫn trình duyệt có sẵn; bị chặn micro hoặc mất kết nối nhận dạng giữa ván thì tạm dừng và cho chuyển sang kiểu gõ. Cần 7.12a, 7.12b (UC-G6).
- [x] **7.12c** Hoàn thiện Mưa từ: màn bắt đầu (chọn kiểu chơi Gõ hoặc Nói, luật chơi, điểm cao nhất của bộ theo kiểu chơi, nút Bắt đầu), mobile 360 px dùng ô nhập ẩn luôn được focus và tính lại khung chơi theo `visualViewport` khi bàn phím hiện, màn kết quả chung kèm "Kỷ lục mới", danh sách từ bị lọt để học lại; thẻ chế độ trong lưới chế độ học; `aria-live` đọc nghĩa của mục tiêu đang khoá; E2E chơi một đợt bằng bàn phím. Cần 7.12b (UC-G6).

### 7G. Quản trị lớp học

- [x] **7.14** ADMIN xếp lớp cho học sinh: `POST /admin/classes/:id/members` nhận `{ userId }` (lớp phải đang hoạt động, tài khoản phải là học sinh, xếp lại thì giữ ngày tham gia cũ), mã lỗi `CLASS_ARCHIVED`, `USER_NOT_STUDENT`; hộp thoại "Xếp lớp" chọn lớp có tìm kiếm, mở từ nút "Xếp lớp" ở bảng học sinh chưa có lớp (`/admin/classes`). Cập nhật `docs/03-api.md` (UC trong `docs/use-cases/06-vai-tro-va-lop-hoc.md`). (#443)

### 7H. Hiệu năng

- [x] **7.15** Giảm độ trễ khi mở trang, giữ nguyên giao diện và logic: script ở `<head>` gửi sẵn `POST /auth/refresh` lúc đọc HTML (chỉ trang trong app và có cookie phiên) để không đợi tải xong JS; bundle client chỉ có tiếng Việt, tiếng Anh tải khi cần (bớt khoảng 70 KB JS mỗi trang); trang Lớp học và Xếp hạng dùng chung một request `/classes/joined`. Số đo và việc còn lại ở `docs/perf-audit-2026-11-27.md`. (#444)

### 7I. Bàn phím trên điện thoại

- [x] **7.16** Mưa từ không còn kẹt khi dùng bộ gõ tiếng Việt (Telex, VNI) hoặc bàn phím có gợi ý từ: ô gõ không do React điều khiển, không ghi đè chữ khi bộ gõ đang soạn (`compositionstart`, `compositionend`), so phần chữ thêm vào sau khi bỏ dấu (`input-diff.ts`, có unit test), xoá chữ vẫn bỏ khoá mục tiêu (#445).
- [x] **7.17** Bàn phím ảo trong Mưa từ: QWERTY a–z và nút xoá, dùng token `game-*`, phím cao 48 px, mặc định bật trên màn cảm ứng (`pointer: coarse`) và không bật bàn phím máy (`inputMode="none"`), nút chuyển qua lại với bàn phím máy, nhớ lựa chọn trên thiết bị; gõ ra chữ có dấu khi đang ở bàn phím máy thì gợi ý chuyển sang bàn phím trong game (#445).
- [x] **7.18** Bố cục khi bàn phím máy mở ở Viết, Nghe viết, Điền từ, Kiểm tra: `interactive-widget=resizes-content`, thu gọn khoảng cách khung học, cuộn câu hỏi và ô gõ vào vùng nhìn thấy, ẩn thanh nộp bài dính dưới của Kiểm tra khi đang gõ (#445).
- [x] **7.19** Hộp thoại "Bộ từ học gần đây" của quản trị hiện tên chế độ theo `common:modes` (Mưa từ, Luyện nói...) thay vì mã như `WORD_RAIN` (#445).
- [x] **7.20** Nhận lời nói đúng hơn ở Mưa từ và Luyện nói: Mưa từ nghe theo ngôn ngữ của bộ từ và giọng đã chọn trong cài đặt (trước đây luôn `en-US`); `gradeSpokenText` ở `@vocab/shared` đổi số 0 đến 100 thành chữ (`4` khớp `four`), coi từ đồng âm là một (two/too/to, write/right...), từ 3 chữ cái cho lệch một chữ nếu giữ chữ đầu (#445).
- [x] **7.21** Chấm đáp án gõ không bắt gõ ký tự không có trên bàn phím: `gradeText` ở `@vocab/shared` đổi nháy cong, gạch dài, dấu chấm lửng về dạng thường, bỏ dấu câu và ký hiệu khi so (`o'clock` gõ `oclock`, `e-mail` gõ `email`, `well-known` gõ `well known`), quy chữ Latin ngoại (ñ, ü, ç, ß...) về chữ gốc; chữ tiếng Việt có dấu vẫn chấm đúng dấu. Áp dụng cho mọi chế độ gõ ở cả web và API (#445).
- [x] **7.22** Làm mới landing page: hero là khung trời đêm Mưa từ (nghĩa rơi bằng CSS, chiến đấu cơ của game vẽ lại bằng SVG `fighter-jet.tsx` theo `drawJet`, tia laser vào nghĩa đang khoá, thanh gõ), dải 10 chế độ chạy ngang (dừng khi rê chuột hoặc focus), khu bento "Học vui, học đều mỗi ngày" (thanh XP chạy, chuỗi ngày, xếp hạng tuần, huy hiệu, lớp học, nhắc học và offline), lộ trình "Một nút, mười bước", lịch ôn và lời mời cuối trang; mỗi phần một khung riêng; chuyển động chỉ dùng `translate`, `scale`, `opacity` và tắt hết khi `prefers-reduced-motion` (#445).
- [x] **7.23** Lộ trình "Bắt đầu học" đi hết 10 chế độ theo thứ tự từ dễ đến khó (Xem thẻ, Trắc nghiệm, Ghép cặp, Học kỹ, Luyện viết, Nghe viết, Điền từ, Luyện nói, Kiểm tra, Mưa từ), bước không dùng được thì bỏ qua; ở điện thoại thanh bước gọn thành "Bước n/10: tên bước" (UC trong `docs/use-cases/05-lo-trinh.md`, #445).
- [x] **7.24** Kiểm tra: bỏ bảng số câu ở đầu trang (cuộn xuống là mất), chuyển vào thanh nộp bài dính dưới; bấm "Đã trả lời x/y câu" để mở hoặc gập lưới câu (`aria-expanded`, chuyển động mở ra tắt khi giảm chuyển động), bấm một câu thì cuộn tới và gập lại; thêm thanh tiến độ mảnh (#445).
- [x] **7.25** Vercel không bỏ sót bản build khi merge kiểu rebase: `vercel-ignore-build.sh` so với bản deploy thành công gần nhất (`VERCEL_GIT_PREVIOUS_SHA`) thay vì chỉ commit cuối; trước đó merge #446 không tạo bản Preview vì commit cuối chỉ đổi test của API.

## Quyết định cần chốt

| Quyết định                | Cần trước việc | Đề xuất                                |
| ------------------------- | -------------- | -------------------------------------- |
| Tên miền production       | 1.20           | Dùng domain riêng cho `app.` và `api.` |
| Dịch vụ đọc văn bản (TTS) | 2.6            | Google Cloud Text-to-Speech, cần thẻ   |
