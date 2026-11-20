# Use case: giai đoạn 2, 3 và 4

Các việc này chưa bắt đầu. Trước khi làm, viết chi tiết thêm luồng chính và ngoại lệ theo mẫu ở `README.md`.

## Giai đoạn 2: Mở rộng

### UC-X1. Hạ tầng dùng chung

- **Việc 2.1, Rate limit Redis:** bộ đếm dùng chung nhiều instance. Redis lỗi thì API vẫn chạy và ghi log. Test hai instance cùng tính một giới hạn.
- **Việc 2.2, Cache bộ công khai:** sửa, xoá, đổi phạm vi phải xoá cache. Test bộ chuyển sang riêng tư không còn đọc được từ cache.
- **Việc 2.3, Staging:** `develop` tự deploy với database và secret riêng. Test smoke trên staging trước khi phát hành.

### UC-X2. Thư mục bộ từ

- **Việc:** 2.4. **Người dùng:** người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:** tạo, đổi tên, xoá thư mục; chuyển bộ từ vào thư mục; lọc danh sách theo thư mục.
- **Ngoại lệ:** xoá thư mục không xoá bộ từ; tên trùng; không dùng được thư mục của người khác.
- **Giao diện:** khung "Quản lý thư mục" và ô lọc "Thư mục" ở trang Bộ từ (`?folder=<id>|none`), ô chọn thư mục trong thao tác của chủ bộ từ.
- **Test đã có:** `folders.integration`, `sets-folders.integration`, `folder-filter.test`, `folder-manager.test`, `my-sets.test`, E2E tạo thư mục, chuyển bộ, lọc, xoá thư mục mà bộ vẫn còn.

### UC-X3. Ảnh và âm thanh cho thẻ

- **Việc:** 2.5, 2.6. **Người dùng:** chủ bộ từ.
- **Phải có:** URL ký sẵn 5 phút, ảnh PNG, JPEG, WebP tối đa 1 MB, xem trước, xoá ảnh; âm thanh TTS được lưu lại và dùng chung cho cùng từ, cùng ngôn ngữ.
- **Ngoại lệ:** sai loại hoặc quá dung lượng; tải lên dở; dịch vụ lưu trữ lỗi thì quay về Web Speech; CSP phải cho phép domain ảnh.
- **Cách test:** integration ký URL và quyền; bộ lưu trữ giả; E2E thêm ảnh rồi thấy trong lúc học.

### UC-X4. Bốn chế độ học mới

| Việc      | Chế độ   | Phải có                                                                                                                                                                                      | Test chính                                                                                            |
| --------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 2.7, 2.13 | Learn    | Đã có. Thẻ chưa thuộc hỏi trắc nghiệm rồi gõ từ, thẻ đã thuộc chỉ gõ từ. Vòng 7 câu, câu sai hỏi lại cuối vòng tới khi đúng, điểm theo lần đầu. Lối vào "Học kỹ" ở trang bộ từ và Ôn hôm nay | `learn.test`, `study-sessions.integration`, `learn-mode.test`, E2E trả lời sai rồi học đến hết, audit |
| 2.8       | Điền từ  | Đã có. Câu ví dụ có chỗ trống, nghĩa làm gợi ý                                                                                                                                               | `cloze.test`, integration, component                                                                  |
| 2.9       | Ghép cặp | Đã có. Vòng 6 cặp, tính giờ, dùng được bằng bàn phím                                                                                                                                         | `match.test`, component, E2E, audit                                                                   |
| 2.10      | Kiểm tra | Đã có. Mỗi thẻ một câu trắc nghiệm hoặc gõ từ, phần 20 câu, không chấm trước khi nộp, cảnh báo câu bỏ trống, kết quả liệt kê câu sai                                                         | `test.test`, integration chấm ở server và nộp hai lần, `test-mode.test`, E2E, audit                   |

Mỗi chế độ dùng `StudyModeStrategy`, chạy được cho tài khoản và khách, trừ khi use case ghi khác.

### UC-X5. Quản trị

- **Việc:** 2.11, 2.14, 2.12, 2.15. **Người dùng:** ADMIN. **Trạng thái:** Đã có API và trang `/admin/users` để tìm, khoá kèm lý do, mở khoá (2.11, 2.14). Lối vào ở trang Tài khoản, chỉ hiện với ADMIN. Trang không cho khoá tài khoản quản trị nên ADMIN không tự khoá mình. Đã có ẩn và bỏ ẩn bộ từ (2.12, 2.15): ADMIN bấm "Ẩn bộ từ" ở trang bộ từ và nhập lý do, chủ bộ thấy thông báo bộ đang bị ẩn kèm lý do.
- **Phải có:** danh sách và tìm người dùng, khoá tài khoản, ẩn và bỏ ẩn nội dung vi phạm, lưu lý do và người thực hiện.
- **Ngoại lệ:** ADMIN không tự khoá mình; không nhận vai trò từ dữ liệu client; bộ bị ẩn biến mất khỏi Khám phá và trang công khai.
- **Cách test:** integration 401, 403 và thành công; E2E ẩn bộ rồi khách không xem được.
- **Test đã có:** `hide-set-button.test`, `set-detail.test` (thông báo bị ẩn), E2E ADMIN ẩn bộ rồi khách không xem được, `admin-sets.integration` (401, 403, 400, 404, ẩn rồi khách và người khác không thấy ở danh sách, chi tiết, học; chủ và ADMIN vẫn thấy; bỏ ẩn), `admin-users.test` (web), E2E ADMIN khoá rồi tài khoản không đăng nhập được, mở khoá rồi đăng nhập lại, `admin-users.integration` gồm 401, 403, tìm, tham số sai, khoá rồi bị chặn đăng nhập và mất phiên, mở khoá, tự khoá mình, không tìm thấy.

### UC-X6. Trải nghiệm và giao diện

- **Việc:** 2.16 đến 2.27. **Người dùng:** mọi người. **Trạng thái:** Đủ. Đã có 2.16 (trang form căn giữa qua `PageContainer`, E2E kiểm tra tiêu đề thẳng hàng và khối căn giữa ở 1280 px) và 2.17 (`AccountMenu` dùng Radix Dropdown Menu: chữ cái đầu và tên, tên ẩn khỏi mắt trên màn hình hẹp nhưng vẫn đọc được, menu Tài khoản, Quản lý người dùng với ADMIN, Đăng xuất; `account-menu.test`, E2E đổi tên thì header cập nhật) và 2.18 (`Select` giữ thẻ `select` gốc, bỏ giao diện mặc định, có mũi tên riêng; trình duyệt hỗ trợ `appearance: base-select` thì danh sách lựa chọn theo token) và 2.19 (`StudyModeGrid` trên trang bộ từ: nút chính "Bắt đầu học" và lưới chế độ có icon, mô tả một dòng; trang công khai của khách giữ hàng nút) và 2.20 (`GET /stats/sets/:id/cards`, `cardMastery()`, nhãn mức nhớ bằng chữ và "Ôn lại dd/MM" trên từng thẻ, khối tiến độ giải thích điều kiện đã thuộc) và 2.21 (Tổng quan có việc nên làm tiếp, bốn ô số liệu, biểu đồ cột 7 ngày một màu kèm bảng cho trình đọc màn hình, thanh mức nhớ có chú thích bằng chữ và phần trăm) và 2.22 (Khám phá dùng lưới `SetCards` có tác giả, mô tả, số thẻ; Bộ từ giữ danh sách dòng kẻ; mô tả hai trang nói rõ thư viện của tôi và cộng đồng) và 2.23 (mục Giọng đọc ở trang Tài khoản chọn Anh Mỹ hoặc Anh Anh, tốc độ bình thường hoặc chậm, lưu trong `localStorage`, có nghe thử và báo khi máy không có đúng giọng; nút Nghe chậm ở Flashcard và Nghe viết; `speech.test`) và 2.24 (phản hồi đúng nảy nhẹ, sai rung ngang 200 đến 240 ms, tắt khi giảm chuyển động; màn kết quả có phần trăm, thanh `meter`, lời khích lệ theo điểm; `study-result.test`) và 2.25 (trang giới thiệu: chồng flashcard bay nhẹ, chip nổi bật, lưới 9 chế độ có icon, dòng thời gian lịch ôn, ba bước số lớn, dải kêu gọi nền bảng đen; hiện dần khi cuộn bằng CSS `animation-timeline: view()`, không thêm JavaScript, tắt khi giảm chuyển động) và 2.26 (Ôn hôm nay có khối "Khi nào thẻ đến hạn ôn?", khi trống báo thẻ tiếp theo đến hạn lúc nào qua `summary.nextDueAt`; ô Từ đã thuộc có chú thích) và 2.27 (`GET /admin/stats`, khối Quản trị ở Tổng quan chỉ cho ADMIN).
- **Vấn đề đã thấy:** nội dung lệch trái ở màn hình rộng; nút chế độ học trải dài khó hình dung; header có ảnh đại diện nhưng không có tên; `select` mặc định xấu; Tổng quan ít thông tin; Bộ từ và Khám phá trông giống nhau; người học không hiểu khi nào thẻ đến hạn và khi nào được tính là đã thuộc; giọng đọc khó nghe và đọc nhanh.
- **Quy tắc đang chạy:** trả lời đúng lần đầu thì thẻ hẹn ôn sau 1 ngày; trả lời đúng khi thẻ đã đến hạn thì giãn ra 6 ngày, rồi nhân với hệ số dễ; trả lời sai thì hẹn lại sau 10 phút. Thẻ "đã thuộc" khi khoảng ôn từ 6 ngày (`MASTERED_INTERVAL_DAYS`), nên cần ít nhất hai lần đúng ở hai ngày khác nhau. Học dồn trong cùng ngày không giãn lịch. Việc 2.20 phải nói rõ quy tắc này trên giao diện, không đổi thuật toán.
- **Phải có:** mỗi trang một hành động chính; đủ loading, empty, error, success; light, dark, 360 px, bàn phím, vùng bấm 44 px; hiệu ứng 150 đến 300 ms và tắt khi `prefers-reduced-motion`; chỉ dùng token trong `docs/05-ui-tokens.md`, thiếu token thì thêm vào tài liệu trước.
- **Giọng đọc (2.23):** chọn giọng `en-US` hoặc `en-GB` có trên máy, không có thì dùng giọng mặc định và báo cho người dùng; tốc độ chậm khoảng 0,7.
- **Cách test:** component cho từng trạng thái; E2E audit accessibility ở light, dark, 360 px cho các trang đã đổi; Lighthouse trang giới thiệu không thấp hơn trước.

## Giai đoạn 3: Lớp học

Cần chốt trước: cách một tài khoản trở thành giáo viên (việc 3.2).

### UC-C1. Lớp và thành viên

- **Việc:** 3.1, 3.2, 3.3, 3.8. **Người dùng:** giáo viên, học sinh.
- **Phải có:** yêu cầu quyền giáo viên và ADMIN duyệt; tạo, sửa, lưu trữ lớp; mã tham gia có thể đổi; xoá thành viên; học sinh rời lớp.
- **Ngoại lệ:** mã sai hoặc đã đổi; tham gia hai lần; học sinh không xem được danh sách lớp của người khác.
- **Cách test:** integration phân quyền đầy đủ; E2E giáo viên tạo lớp, học sinh tham gia.

### UC-C2. Giao bài và bộ từ của lớp

- **Việc:** 3.4, 3.5, 3.7, 3.8. **Người dùng:** giáo viên, học sinh.
- **Phải có:** bộ `CLASS` chỉ thành viên xem được; giao bộ từ, chế độ, hạn nộp; học sinh thấy bài cần làm.
- **Ngoại lệ:** học sinh vào lớp sau khi đã giao; quá hạn; bộ bị xoá sau khi giao; học sinh rời lớp mất quyền xem.
- **Cách test:** integration quyền `CLASS`; test mốc hạn nộp theo giờ Việt Nam; E2E giao bài, học, trạng thái hoàn thành.

### UC-C3. Kết quả lớp

- **Việc:** 3.6, 3.7. **Người dùng:** giáo viên.
- **Phải có:** tỉ lệ hoàn thành, điểm theo học sinh, từ cả lớp hay sai, trạng thái chưa có dữ liệu.
- **Ngoại lệ:** học sinh đã rời lớp; lớp đông phải phân trang; giáo viên khác không xem được.
- **Cách test:** integration số liệu và quyền; kiểm tra truy vấn với dữ liệu lớn.

## Giai đoạn 4: Luyện nói và offline

### UC-O1. Luyện nói

- **Việc:** 4.1, 4.4. **Người dùng:** người học. **Trạng thái:** Đã có enum `SPEAK`, strategy và API (4.1, `speak.test`, integration). Giao diện (4.4): bấm nói thì trình duyệt xin micro, hiện câu nghe được và đúng sai, thử lại chỉ để luyện (điểm theo lần đầu), bỏ qua gửi rỗng; báo khi từ chối micro, không nghe thấy, trình duyệt không hỗ trợ. `Permissions-Policy` cho `microphone=(self)`. Test: `speak-mode.test`, E2E với bộ nhận dạng giả, audit.
- **Phải có:** xin quyền micro khi bắt đầu, ghi nhận và so với từ đích, cho thử lại và bỏ qua.
- **Ngoại lệ:** từ chối micro; trình duyệt không hỗ trợ; môi trường ồn. `Permissions-Policy` và CSP phải được nới đúng phạm vi.
- **Cách test:** unit so khớp; E2E với bộ nhận dạng giả; thủ công trên điện thoại.

### UC-O2. Cài đặt và học offline

- **Việc:** 4.2, 4.3, 4.5, 4.6. **Người dùng:** người học. **Trạng thái:** Đã có 4.2: `manifest.webmanifest` (mở vào Tổng quan, `standalone`), icon PNG 192 và 512 từ `/pwa-icon/[size]`, `public/sw.js` lưu tạm `/_next/static` và icon, điều hướng khi mất mạng trả `/offline`, không lưu request `/api/`. Test `manifest.test`, E2E `pwa.spec`. Đã có 4.3: `lib/offline-store.ts` lưu bộ từ trong IndexedDB, nút Tải về máy, Cập nhật bản offline, Xoá bản offline ở trang bộ từ, báo khi hết dung lượng; trang `/offline` liệt kê bộ đã tải và xem thẻ; đăng xuất xoá cơ sở dữ liệu offline. Đã có 4.5: nút Học offline ở trang `/offline` mở phiên Flashcard bằng `createGuestBackend({ loadSet, onFinish })`, phiên xong lưu vào kho `pending` trong IndexedDB; service worker lưu sẵn cả mã của trang offline; E2E tắt mạng học hết bộ và có một phiên trong hàng đợi. Đã có 4.6: `syncPendingSessions()` chạy khi vào app đã đăng nhập và khi có mạng lại, tạo phiên với đúng thẻ đã học, gửi đáp án theo lô 200, kết thúc, xoá khỏi hàng đợi; bộ đã xoá hoặc không còn quyền thì bỏ, lỗi mạng thì giữ lại; E2E tải về, học offline, có mạng lại thấy thông báo đã gửi. Đăng xuất trước khi đồng bộ sẽ xoá các phiên chưa gửi.
- **Phải có:** manifest, cài lên thiết bị, chọn bộ để tải về, học khi mất mạng, hàng đợi đáp án đồng bộ khi có mạng.
- **Ngoại lệ:** bộ đã đổi khi offline; học trên hai thiết bị; hết dung lượng; đăng xuất phải xoá dữ liệu offline.
- **Cách test:** E2E chế độ offline của Playwright; integration gửi trùng đáp án; thủ công trên Android và iOS.

## Ý tưởng chưa xếp lịch

Các mục này chưa nằm trong file tiến độ, cần người phụ trách chọn trước khi làm.

- Tuỳ chọn phiên học: số câu, trộn thứ tự, đảo chiều từ và nghĩa.
- Xác minh email khi đăng ký.
- Thùng rác để khôi phục bộ từ trong 30 ngày.
- Sitemap và ảnh chia sẻ cho trang công khai.
