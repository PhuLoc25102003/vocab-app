# Tiến độ dự án

Cập nhật lần cuối: 2026-11-20

**Đang ở:** Giai đoạn 2, 3, 4 đã xong phần làm được trong repo. Các việc dùng dịch vụ ngoài (email gửi thật cho 1.49, Upstash 2.1 và 2.2, R2 2.5) được làm code trước bằng adapter có bản giả, tài khoản chỉ cần khi bật thật (hướng dẫn ở `docs/08-deploy.md`, mục "Dịch vụ cần tài khoản"). Sentry (1.31) đã hoãn. Còn phát hành vào `main` (1.35) và đo Lighthouse trên production (1.34).

Giai đoạn 3 đã có schema lớp học (3.1), API giáo viên quản lý lớp (3.3), API thành viên lớp (3.9), quyền xem bộ `CLASS` (3.4) API giao bộ từ (3.5) API học sinh xem bài cần làm (3.10) và API kết quả lớp (3.6).

**Việc tiếp theo:**

Làm trước các việc không cần người dùng xác nhận; việc cần tài khoản, quyết định hoặc phát hành để cuối và gom lại hỏi một lần.

1. Giai đoạn 5: 5.16, 5.17 (giáo viên theo dõi lớp), dashboard 5.18 đến 5.22, cuối cùng E2E 5.23.
2. Giai đoạn 6 (đa ngôn ngữ bằng i18next, ADR 0003): 6.1 làm nền trước, các việc dịch 6.3 đến 6.6 làm sau giai đoạn 5 để không dịch hai lần màn đang sửa.
3. Phát hành `develop` vào `main` (việc 1.35), cần bạn xác nhận, các bước ở `docs/08-deploy.md`.
4. Đo lại Lighthouse trên production (việc 1.34), sau khi phát hành.

## Tổng quan

Tỉ lệ tính theo số đầu việc, không phản ánh khối lượng của từng việc.

| Giai đoạn               | Mục tiêu                                   |    Xong |    Tổng | Trạng thái |
| ----------------------- | ------------------------------------------ | ------: | ------: | ---------- |
| 0. Nền tảng             | Khung dự án và nền chung cho mọi tính năng |      13 |      13 | Xong       |
| 1. MVP                  | Học sinh dùng được trọn vẹn trên web thật  |      52 |      54 | Đang làm   |
| 2. Mở rộng              | Thêm chế độ học, nội dung và quản trị      |      40 |      42 | Đang làm   |
| 3. Lớp học              | Giáo viên giao bài và xem kết quả          |      14 |      14 | Xong       |
| 4. Luyện nói và offline | Luyện phát âm, học khi mất mạng            |       6 |       6 | Xong       |
| 5. Vai trò và lớp học   | Tổng quan theo vai trò, giao và nộp bài    |      20 |      28 | Đang làm   |
| 6. Đa ngôn ngữ          | Toàn bộ giao diện tiếng Việt và tiếng Anh  |       0 |       7 | Chưa làm   |
| **Toàn dự án**          |                                            | **145** | **164** | **88%**    |

## Cách cập nhật

- Làm theo thứ tự từ trên xuống, trừ khi việc sau không phụ thuộc việc trước.
- Mỗi việc tương ứng một issue và một PR. Việc quá lớn thì tách thành nhiều việc nhỏ ngay trong file này.
- PR của một việc **chỉ sửa dòng của việc đó**: đổi `[ ]` thành `[x]` và ghi số PR. Không sửa bảng tổng quan, "Đang ở", "Việc tiếp theo" trong PR của việc, vì nhiều PR song song cùng sửa các dòng đó sẽ xung đột.
- Bảng tổng quan tính bằng `npm run progress` (đếm `[x]` của từng giai đoạn). Chạy lệnh này, cùng với cập nhật "Đang ở" và "Việc tiếp theo", trong một PR `docs(progress): sync` khi không còn PR nào khác đang mở, ví dụ cuối một loạt việc.
- Thêm hoặc tách việc mới thì làm một PR docs riêng và merge ngay khi CI xanh, không gộp vào PR đang code.
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
- [ ] **5.16** Web lớp học: danh sách lớp dạng thẻ hàng có số liệu, trang lớp gọn (mã lớp thành chip, modal "Mời học sinh", tab Bài tập và Học sinh trong URL, bảng có phân trang), modal hồ sơ học sinh. Cần 5.8, 5.15 (GAP-19, GAP-20).
- [ ] **5.17** Trang kết quả bài giao theo bài nộp: trạng thái 5 loại, điểm theo từng chế độ, lọc theo trạng thái. Cần 5.12.

### 5F. Tổng quan theo vai trò

- [ ] **5.18** Tổng quan học sinh: khối "Bài tập lớp" đầu trang (bỏ lỡ, hạn gần nhất, tối đa 3), ẩn khi chưa vào lớp. Cần 5.12 (GAP-16).
- [ ] **5.19** API `GET /teacher/overview`: ô số liệu, cần chú ý, sắp đến hạn, bài vừa nộp. Cần 5.15.
- [ ] **5.20** Tổng quan giáo viên theo thiết kế: nút chính Giao bài (modal có chọn lớp), trạng thái trống 3 bước, phần học cá nhân thu gọn. Cần 5.13, 5.19 (GAP-16).
- [ ] **5.21** API thống kê ADMIN mở rộng: người hoạt động 7 ngày, đăng ký mới, phiên học, phân bố vai trò, chuỗi 30 ngày, bộ công khai mới để rà (GAP-16).
- [ ] **5.22** Tổng quan ADMIN theo thiết kế: 4 ô số liệu, biểu đồ 30 ngày, Cần xử lý, Vai trò, Người dùng mới, Bộ công khai mới có nút Ẩn. Cần 5.21 (GAP-16).
- [ ] **5.23** E2E: giáo viên giao bài 3 chế độ từ bộ riêng tư, học sinh làm và nộp, giáo viên thấy ở Tổng quan và modal hồ sơ; audit accessibility các trang mới ở light, dark, 360 px.

### 5G. Trải nghiệm học và độ gọn của form

- [x] **5.24** Âm thanh khi trả lời đúng ở mọi chế độ học trừ Kiểm tra, tạo bằng Web Audio, bật tắt ở Tài khoản (mặc định bật); use case UC-L12 trong `docs/use-cases/03-hoc-tap.md`. (#348).
- [x] **5.25** `Combobox` dùng chung có tìm kiếm ngay trong ô chọn (mẫu ARIA combobox, lọc không dấu); thay ô chọn bộ và bỏ ô "Tìm bộ từ" riêng ở modal giao bài, thay hai ô ngôn ngữ ở form bộ từ; dùng cho ô chọn lớp ở 5.20; ghi quy tắc vào `docs/05-ui-tokens.md` (GAP-27, #352).
- [x] **5.26** `FormDialog` rộng hơn (cỡ `md` 560 px, `lg` 720 px cho giao bài), cao theo nội dung ở mọi kích thước; ở 360 px là tấm đáy cao theo nội dung thay vì toàn màn hình; cập nhật `docs/05-ui-tokens.md` (GAP-28, #350).
- [x] **5.27** Giao bài chọn được từ 1 đến tất cả chế độ dùng được với bộ (bỏ `MAX_ASSIGNMENT_MODES = 5`), nút "Chọn tất cả" và "Bỏ chọn" trong modal; cập nhật `docs/03-api.md` (GAP-29, #354).
- [x] **5.28** Ôn hôm nay chọn một, nhiều hoặc tất cả chế độ, các phiên chạy nối tiếp như lộ trình, bỏ qua chế độ không dùng được, lưu lựa chọn trên thiết bị; UC-L10 trong `docs/use-cases/03-hoc-tap.md` (GAP-29, #358).

## Giai đoạn 6: Đa ngôn ngữ

**Xong khi:** mọi màn đổi được giữa tiếng Việt và tiếng Anh, lựa chọn được nhớ, không còn chữ viết cứng. Thiết kế ở `docs/adr/0003-da-ngon-ngu-bang-i18next.md`, use case ở `docs/use-cases/07-da-ngon-ngu.md`.

- [ ] **6.1** Nền i18next: `i18next`, `react-i18next`, file `locales/vi` và `locales/en`, cookie `vocab.locale`, `getT` cho server và `I18nProvider` cho client, `<html lang>`, nút đổi ngôn ngữ ở header và Tài khoản, khoá có kiểu, test hai bộ khoá giống nhau; quy tắc "không viết cứng chuỗi giao diện" trong `docs/06-conventions.md` (GAP-30).
- [ ] **6.2** Lỗi và form: thông báo theo `ERROR_CODES` ở namespace `errors`, Zod schema trong shared dùng khoá dịch, toast và hộp xác nhận. Cần 6.1.
- [ ] **6.3** Dịch trang giới thiệu, đăng nhập, đăng ký, quên mật khẩu, trang công khai, Khám phá và metadata. Cần 6.1.
- [ ] **6.4** Dịch khung app, Tổng quan, Bộ từ, thư mục, trình soạn, nhập từ. Cần 6.1.
- [ ] **6.5** Dịch các chế độ học, lộ trình, Ôn hôm nay, thống kê, offline. Cần 6.1.
- [ ] **6.6** Dịch lớp học, bài tập, Tài khoản, quản trị. Cần 6.1.
- [ ] **6.7** Ngày giờ và số theo ngôn ngữ, script báo chữ tiếng Việt viết cứng trong `.tsx` chạy cùng `npm run lint`, E2E đổi ngôn ngữ và audit ở cả hai ngôn ngữ. Cần 6.2 đến 6.6.

## Quyết định cần chốt

| Quyết định                | Cần trước việc | Đề xuất                                |
| ------------------------- | -------------- | -------------------------------------- |
| Tên miền production       | 1.20           | Dùng domain riêng cho `app.` và `api.` |
| Dịch vụ đọc văn bản (TTS) | 2.6            | Google Cloud Text-to-Speech, cần thẻ   |
