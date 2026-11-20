# Tiến độ dự án

Cập nhật lần cuối: 2026-11-20

**Đang ở:** Giai đoạn 2 và 4 đã xong phần làm được trong repo (chế độ học, quản trị, giao diện, PWA, học offline). Còn lại cần tài khoản dịch vụ (Sentry, email, Upstash, R2, staging), quyết định cấp quyền giáo viên (3.2), phát hành vào `main` (1.35) và đo Lighthouse trên production (1.34).

Giai đoạn 3 đã có schema lớp học (3.1).

**Việc tiếp theo:**

1. API tạo lớp, quản lý thành viên, tham gia lớp (việc 3.3), không cần chờ quyết định 3.2.
2. Phát hành `develop` vào `main` (việc 1.35), cần bạn xác nhận.
3. Đo lại Lighthouse trên production (việc 1.34).

## Tổng quan

Tỉ lệ tính theo số đầu việc, không phản ánh khối lượng của từng việc.

| Giai đoạn               | Mục tiêu                                   |   Xong |    Tổng | Trạng thái |
| ----------------------- | ------------------------------------------ | -----: | ------: | ---------- |
| 0. Nền tảng             | Khung dự án và nền chung cho mọi tính năng |     13 |      13 | Xong       |
| 1. MVP                  | Học sinh dùng được trọn vẹn trên web thật  |     50 |      54 | Đang làm   |
| 2. Mở rộng              | Thêm chế độ học, nội dung và quản trị      |     22 |      27 | Đang làm   |
| 3. Lớp học              | Giáo viên giao bài và xem kết quả          |      1 |       8 | Đang làm   |
| 4. Luyện nói và offline | Luyện phát âm, học khi mất mạng            |      6 |       6 | Xong       |
| **Toàn dự án**          |                                            | **92** | **108** | **85%**    |

## Cách cập nhật

- Làm theo thứ tự từ trên xuống, trừ khi việc sau không phụ thuộc việc trước.
- Mỗi việc tương ứng một issue và một PR. Việc quá lớn thì tách thành nhiều việc nhỏ ngay trong file này.
- Khi bắt đầu, thêm `Đang làm: <tên nhánh>` vào cuối dòng.
- Trong PR của việc đó, đổi `[ ]` thành `[x]`, ghi số PR, cập nhật bảng tổng quan, "Đang ở" và "Việc tiếp theo".
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
- [ ] **1.31** Sentry cho web và API, theo dõi uptime. Cần tài khoản Sentry.
- [x] **1.50** Log JSON bằng Pino, có `requestId`, ẩn mật khẩu, token, cookie (#133).
- [x] **1.32** Header bảo mật và CSP cho web, rà toàn bộ checklist trong `docs/04-security.md` (#96).
- [x] **1.33** Test E2E Playwright cho 3 đến 5 luồng chính (#98).
- [ ] **1.34** Rà accessibility, dark mode, màn hình 360 px, Lighthouse đạt mục tiêu. Accessibility đã đạt, Performance còn 85 đến 88.
- [ ] **1.35** PR phát hành từ `develop` vào `main`, kiểm tra production.

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
- [ ] **1.49** Quên mật khẩu qua email (GAP-13). Chờ chọn dịch vụ gửi email.

## Giai đoạn 2: Mở rộng

**Xong khi:** đủ 8 chế độ học, có quản lý thư mục, ảnh và công cụ quản trị.

### 2A. Hạ tầng

- [ ] **2.1** Rate limit dùng Upstash Redis.
- [ ] **2.2** Cache bộ từ công khai.
- [ ] **2.3** Môi trường staging cho `develop`.

### 2B. Nội dung

- [x] **2.4** Thư mục bộ từ trên API và web (#151).
- [ ] **2.5** Ảnh cho thẻ từ: R2 và `POST /uploads/presign`.
- [ ] **2.6** Tạo và lưu âm thanh TTS lên R2.

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
- [x] **2.25** Thiết kế lại trang giới thiệu: hiện đại, có hiệu ứng khi cuộn, minh hoạ các chế độ học, lời kêu gọi rõ ràng; đạt Lighthouse như trước (#220).

## Giai đoạn 3: Lớp học

**Xong khi:** giáo viên tạo lớp, giao bộ từ và xem được kết quả của học sinh.

- [x] **3.1** Schema `Class`, `ClassMember`, `Assignment`.
- [ ] **3.2** Quy trình cấp vai trò giáo viên.
- [ ] **3.3** API tạo lớp, quản lý thành viên, tham gia lớp.
- [ ] **3.4** Quyền xem bộ từ có `visibility = CLASS`.
- [ ] **3.5** API giao bộ từ và theo dõi hạn nộp.
- [ ] **3.6** API kết quả theo lớp và theo học sinh.
- [ ] **3.7** Web cho giáo viên.
- [ ] **3.8** Web cho học sinh trong lớp.

## Giai đoạn 4: Luyện nói và offline

**Xong khi:** học sinh luyện nói được và tiếp tục học khi mất mạng.

- [x] **4.1** Nền chế độ luyện nói: enum `SPEAK`, strategy và API (#190).
- [x] **4.4** Giao diện luyện nói: xin quyền micro, nhận dạng giọng nói, thử lại, bỏ qua (#192).
- [x] **4.2** PWA: manifest, cài lên thiết bị, cache giao diện (#226).
- [x] **4.3** Tải bộ từ về máy (IndexedDB), xem thẻ ở trang offline, xoá dữ liệu offline khi đăng xuất (#228).
- [x] **4.5** Học Flashcard khi mất mạng với bộ đã tải, phiên đã xong vào hàng đợi trên máy; service worker lưu sẵn mã của trang offline (#231).
- [x] **4.6** Gửi hàng đợi phiên học offline lên máy chủ khi có mạng và đã đăng nhập (#233).

## Quyết định cần chốt

| Quyết định                         | Cần trước việc | Đề xuất                                     |
| ---------------------------------- | -------------- | ------------------------------------------- |
| Tên miền production                | 1.20           | Dùng domain riêng cho `app.` và `api.`      |
| Cách một tài khoản thành giáo viên | 3.2            | Người dùng gửi yêu cầu, ADMIN duyệt         |
| Dịch vụ gửi email                  | 1.49           | Chọn dịch vụ có gói miễn phí, cần tài khoản |
