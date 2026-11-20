# Use case theo chức năng

Bộ tài liệu này trả lời ba câu hỏi cho từng việc trong `docs/07-progress.md`: chức năng phải có gì, chạy ra sao khi đúng và khi sai, kiểm tra thế nào mới coi là đủ.

Trạng thái được đối chiếu với code ở `develop` ngày 2026-11-19. Các lỗ hổng ghi "đã tái hiện" được xác nhận bằng cách chạy bản production trên trình duyệt.

## Cách đọc

| File                                                 | Nội dung                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------- |
| [01-tai-khoan.md](01-tai-khoan.md)                   | Đăng ký, đăng nhập, phiên, quyền, tài khoản                            |
| [02-bo-tu.md](02-bo-tu.md)                           | Bộ từ, thẻ từ, trang công khai, Khám phá, nhập                         |
| [03-hoc-tap.md](03-hoc-tap.md)                       | Phiên học, 4 chế độ, lịch ôn, thống kê                                 |
| [04-nen-tang.md](04-nen-tang.md)                     | Nền tảng, trang giới thiệu, deploy, phát hành                          |
| [05-lo-trinh.md](05-lo-trinh.md)                     | Giai đoạn 2, 3, 4                                                      |
| [06-vai-tro-va-lop-hoc.md](06-vai-tro-va-lop-hoc.md) | Giai đoạn 5: tổng quan theo vai trò, giao và nộp bài, độ gọn giao diện |

Mỗi use case gồm: việc liên quan, người dùng, trạng thái, phải có, luồng chính, ngoại lệ, test và phần còn thiếu.

| Trạng thái     | Ý nghĩa                                               |
| -------------- | ----------------------------------------------------- |
| Đủ             | Đã có đủ chức năng trong phạm vi MVP                  |
| Thiếu          | Đã có phần chính nhưng còn lỗ hổng, xem mã `GAP`      |
| Chưa làm       | Việc chưa bắt đầu                                     |
| Chờ quyết định | Cần người phụ trách chọn phương án hoặc cấp tài khoản |

## Quy tắc khi làm một việc

1. Đọc use case của việc trước khi code. Nếu thiếu tình huống, bổ sung vào đây trong cùng PR.
2. Làm đủ mục "Phải có" và "Ngoại lệ", không chỉ đường đi thuận lợi.
3. Mọi màn hình phải trả lời được: vào từ đâu, làm xong đi đâu, nút quay lại của trình duyệt đưa về đâu, rời giữa chừng thì dữ liệu ra sao.
4. Viết test theo bốn tầng dưới đây, tầng nào không áp dụng thì bỏ qua.
5. Xong việc thì cập nhật trạng thái use case và `docs/07-progress.md`.

| Tầng        | Công cụ           | Dùng cho                                     |
| ----------- | ----------------- | -------------------------------------------- |
| Unit        | Vitest            | Chấm điểm, SRS, schema, hàm thuần            |
| Integration | Vitest, Supertest | Endpoint, phân quyền, database               |
| Component   | Testing Library   | Bốn trạng thái dữ liệu, form, phím tắt       |
| E2E         | Playwright        | Luồng xuyên trang, điều hướng, tải lại trang |
| Thủ công    | Trình duyệt       | Light, dark, 360 px, bàn phím, âm thanh      |

## Lỗ hổng đã phát hiện

Các mục này đã thành việc 1.37 đến 1.49 trong phần 1H của file tiến độ. GAP-01 đến GAP-12 đã xử lý xong, GAP-13 đã xử lý ở 1.49a và 1.49b, gửi thư thật cần khoá Brevo.

| Mã     | Vấn đề                                                                                       | Bằng chứng  | Mức | Việc |
| ------ | -------------------------------------------------------------------------------------------- | ----------- | --- | ---- |
| GAP-01 | Lưu bộ từ xong, nút quay lại của trình duyệt về form trống `/sets/new`                       | Đã tái hiện | Cao | 1.37 |
| GAP-02 | Đang sửa dở mà bấm "Quay lại", "Huỷ" hoặc menu thì mất dữ liệu, không có cảnh báo            | Đã tái hiện | Cao | 1.38 |
| GAP-03 | Tải lại trang giữa phiên làm mất đáp án chưa gửi và học lại từ đầu                           | Đã tái hiện | Cao | 1.39 |
| GAP-04 | Không có trang tài khoản: không đổi được tên, mật khẩu, không xoá được tài khoản trên web    | Đã tái hiện | Cao | 1.40 |
| GAP-05 | Đường dẫn sai hiện trang 404 tiếng Anh mặc định, không có lối về                             | Đã tái hiện | Cao | 1.41 |
| GAP-06 | Khách bị đẩy sang đăng nhập khi vào Khám phá, dù API tìm bộ từ công khai không cần đăng nhập | Đã tái hiện | Vừa | 1.42 |
| GAP-07 | Danh sách bộ từ của tôi không tìm kiếm, không sắp xếp được                                   | Đọc code    | Vừa | 1.43 |
| GAP-08 | Tổng quan không báo số thẻ đến hạn, chi tiết bộ từ không cho biết tiến độ của bộ đó          | Đọc code    | Vừa | 1.44 |
| GAP-09 | Kết quả chỉ có "Học lại" toàn bộ, trang Ôn hôm nay chỉ ôn được bằng Flashcard                | Đọc code    | Vừa | 1.45 |
| GAP-10 | Trang công khai thiếu nút quay lại, chủ bộ từ không có nút sao chép đường dẫn chia sẻ        | Đọc code    | Vừa | 1.46 |
| GAP-11 | E2E chưa phủ sửa, xoá, sao chép bộ từ, Khám phá, Ôn hôm nay và 3 chế độ học còn lại          | Đọc code    | Vừa | 1.47 |
| GAP-12 | API chưa có rate limit chung cho route ngoài đăng nhập (issue #95)                           | Đọc code    | Cao | 1.48 |
| GAP-13 | Không có quên mật khẩu, người quên mật khẩu mất quyền vào tài khoản                          | Đọc code    | Cao | 1.49 |

## Bản đồ việc và use case

| Việc             | Use case                                                          |
| ---------------- | ----------------------------------------------------------------- |
| 0.1 đến 0.13     | [Nền tảng](04-nen-tang.md#uc-p1-nền-tảng-dự-án)                   |
| 1.1              | UC-A1, UC-A2                                                      |
| 1.2              | UC-A4, UC-A5                                                      |
| 1.3              | UC-A6                                                             |
| 1.4              | UC-A7, UC-A8                                                      |
| 1.5              | UC-A1, UC-A2, UC-A4, UC-A6                                        |
| 1.6              | UC-A3                                                             |
| 1.7              | UC-S1, UC-S2, UC-S4, UC-S5, UC-S6, UC-S9                          |
| 1.8              | UC-S3                                                             |
| 1.9              | UC-S7                                                             |
| 1.10             | UC-S1                                                             |
| 1.11             | UC-S2, UC-S3, UC-S4                                               |
| 1.12             | UC-S5, UC-S8                                                      |
| 1.13             | UC-L1, UC-L10                                                     |
| 1.14, 1.15       | UC-L2, UC-L3                                                      |
| 1.16             | UC-L4, UC-L5                                                      |
| 1.17             | UC-L6                                                             |
| 1.18 đến 1.20    | UC-P3                                                             |
| 1.21 đến 1.23    | UC-S10                                                            |
| 1.24, 1.25, 1.26 | UC-L7, UC-L8, UC-L9                                               |
| 1.27             | UC-L10                                                            |
| 1.28             | UC-L11                                                            |
| 1.29             | UC-P2                                                             |
| 1.30             | UC-P4                                                             |
| 1.31, 1.50       | UC-P5                                                             |
| 1.32, 1.48       | UC-P6                                                             |
| 1.33, 1.47       | UC-P7                                                             |
| 1.34             | UC-P8                                                             |
| 1.35             | UC-P9                                                             |
| 1.36             | UC-S9                                                             |
| 1.37, 1.38       | UC-S2, UC-S4                                                      |
| 1.39             | UC-L2                                                             |
| 1.40             | UC-A5, UC-A7, UC-A8                                               |
| 1.41             | UC-P10                                                            |
| 1.42             | UC-S9                                                             |
| 1.43             | UC-S1                                                             |
| 1.44             | UC-S5, UC-L11                                                     |
| 1.45             | UC-L3, UC-L10                                                     |
| 1.46             | UC-S5, UC-S8                                                      |
| 1.49a, 1.49b     | UC-A9                                                             |
| 2.1 đến 4.3      | [Lộ trình](05-lo-trinh.md)                                        |
| 5.1 đến 5.23     | [Vai trò và lớp học](06-vai-tro-va-lop-hoc.md), GAP-14 đến GAP-26 |
