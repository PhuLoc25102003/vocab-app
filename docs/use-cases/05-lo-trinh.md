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

- **Việc:** 2.11, 2.12. **Người dùng:** ADMIN.
- **Phải có:** danh sách và tìm người dùng, khoá tài khoản, ẩn và bỏ ẩn nội dung vi phạm, lưu lý do và người thực hiện.
- **Ngoại lệ:** ADMIN không tự khoá mình; không nhận vai trò từ dữ liệu client; bộ bị ẩn biến mất khỏi Khám phá và trang công khai.
- **Cách test:** integration 401, 403 và thành công; E2E ẩn bộ rồi khách không xem được.

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

- **Việc:** 4.1. **Người dùng:** người học.
- **Phải có:** xin quyền micro khi bắt đầu, ghi nhận và so với từ đích, cho thử lại và bỏ qua.
- **Ngoại lệ:** từ chối micro; trình duyệt không hỗ trợ; môi trường ồn. `Permissions-Policy` và CSP phải được nới đúng phạm vi.
- **Cách test:** unit so khớp; E2E với bộ nhận dạng giả; thủ công trên điện thoại.

### UC-O2. Cài đặt và học offline

- **Việc:** 4.2, 4.3. **Người dùng:** người học.
- **Phải có:** manifest, cài lên thiết bị, chọn bộ để tải về, học khi mất mạng, hàng đợi đáp án đồng bộ khi có mạng.
- **Ngoại lệ:** bộ đã đổi khi offline; học trên hai thiết bị; hết dung lượng; đăng xuất phải xoá dữ liệu offline.
- **Cách test:** E2E chế độ offline của Playwright; integration gửi trùng đáp án; thủ công trên Android và iOS.

## Ý tưởng chưa xếp lịch

Các mục này chưa nằm trong file tiến độ, cần người phụ trách chọn trước khi làm.

- Tuỳ chọn phiên học: số câu, trộn thứ tự, đảo chiều từ và nghĩa.
- Xác minh email khi đăng ký.
- Thùng rác để khôi phục bộ từ trong 30 ngày.
- Sitemap và ảnh chia sẻ cho trang công khai.
