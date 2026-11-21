# Use case: giao diện hai ngôn ngữ

Góp ý ngày 2026-11-21: cần đổi toàn bộ trang web giữa tiếng Việt và tiếng Anh. Thiết kế kỹ thuật ở `docs/adr/0003-da-ngon-ngu-bang-i18next.md`.

| Mã     | Vấn đề                                                          | Nguồn | Mức | Việc        |
| ------ | --------------------------------------------------------------- | ----- | --- | ----------- |
| GAP-30 | Toàn bộ giao diện viết cứng tiếng Việt, không đổi được ngôn ngữ | Góp ý | Vừa | 6.1 đến 6.7 |

## UC-I1. Đổi ngôn ngữ

- **Việc:** 6.1. **Người dùng:** mọi người, kể cả khách. **Trạng thái:** Chưa làm.
- **Phải có:** nút đổi ngôn ngữ ở header (icon quả địa cầu kèm `VI` hoặc `EN`, vùng bấm 44 px) trên mọi trang, kể cả trang giới thiệu, đăng nhập, trang công khai; mục "Ngôn ngữ" trong Tài khoản. Hai lựa chọn: Tiếng Việt, English. Đổi xong trang hiện ngôn ngữ mới ngay, giữ nguyên trang và dữ liệu đang nhập, lựa chọn được nhớ trên thiết bị.
- **Luồng chính:** bấm nút, chọn English, toàn bộ chữ giao diện chuyển sang tiếng Anh; tải lại hay mở tab mới vẫn là tiếng Anh; chọn lại Tiếng Việt thì đổi lại.
- **Quy tắc:** mặc định tiếng Việt. `<html lang>` theo ngôn ngữ. Chỉ dịch chữ giao diện, thông báo, lỗi, tiêu đề trang; nội dung người dùng nhập giữ nguyên. Ngày giờ theo ngôn ngữ: `21/11/2026 23:59` ở tiếng Việt, `11/21/2026 11:59 PM` ở tiếng Anh.
- **Ngoại lệ:** cookie bị chặn thì vẫn đổi được trong lần dùng đó; khoá thiếu ở tiếng Anh thì hiện tiếng Việt, không hiện tên khoá; đang mở modal có dữ liệu thì đổi ngôn ngữ không làm mất dữ liệu.
- **Test cần có:** unit hai bộ khoá giống nhau; component đổi ngôn ngữ; E2E đổi sang English, tải lại vẫn English, audit accessibility ở cả hai ngôn ngữ.

## UC-I2. Lỗi và form theo ngôn ngữ

- **Việc:** 6.2. **Trạng thái:** Chưa làm.
- **Phải có:** thông báo lỗi API hiện theo `error.code` bằng ngôn ngữ đang chọn; lỗi kiểm tra form (Zod) dịch theo khoá; toast và hộp xác nhận dịch đủ.
- **Ngoại lệ:** mã lỗi lạ thì dùng `message` của máy chủ; lỗi mạng có câu riêng ở cả hai ngôn ngữ.

## UC-I3. Dịch đủ các màn

- **Việc:** 6.3 đến 6.6. **Trạng thái:** Chưa làm.
- **Phải có:** mọi màn có bản tiếng Anh, gồm 4 trạng thái loading, empty, error, success, tiêu đề tab (metadata) và nhãn `aria-*`.
- **Kiểm tra:** chạy test của màn với tiếng Anh ở một ca thuận lợi; mở màn ở English, không còn chữ Việt ngoài nội dung người dùng.

## UC-I4. Không để sót chữ viết cứng

- **Việc:** 6.7. **Trạng thái:** Chưa làm.
- **Phải có:** script chạy cùng `npm run lint` báo chuỗi có dấu tiếng Việt trong `.tsx` ngoài `locales/` và test; ngày giờ, số theo ngôn ngữ; E2E đổi ngôn ngữ.
