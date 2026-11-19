# Use case: bộ từ và thẻ từ

Giới hạn chung: tên bộ 200 ký tự, mô tả 2.000, từ 200, nghĩa 1.000, tối đa 2.000 thẻ mỗi bộ.

## UC-S1. Xem danh sách bộ từ của tôi

- **Việc:** 1.7, 1.10, 1.43. **Người dùng:** người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:** danh sách dạng dòng với tên, số thẻ, phạm vi, ngày cập nhật; phân trang trên URL; nút tạo bộ; ô tìm theo tên; chọn cách sắp xếp.
- **Luồng chính:** mở `/sets`, thấy bộ mới sửa ở đầu, tìm hoặc sắp xếp, mở một bộ, quay lại vẫn đúng trang và từ khoá.
- **Ngoại lệ:** chưa có bộ nào; không có kết quả tìm kiếm; số trang vượt quá; lỗi mạng có nút thử lại.
- **Test đã có:** `sets.integration`, `my-sets.test`.
- **Test cần thêm:** E2E tìm rồi mở rồi quay lại.

## UC-S2. Tạo bộ từ

- **Việc:** 1.7, 1.11, 1.37, 1.38. **Người dùng:** người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:** tên, mô tả, ngôn ngữ từ và nghĩa, phạm vi Riêng tư hoặc Công khai, soạn thẻ, nút lưu, nút huỷ, nút quay lại.
- **Luồng chính:** từ `/sets` bấm "Tạo bộ từ", nhập, lưu, thấy thông báo và tới trang chi tiết. Nút quay lại của trình duyệt phải về `/sets`, không về form đã lưu.
- **Ngoại lệ:**
  - Dữ liệu sai: focus ô lỗi đầu tiên, giữ nguyên nội dung.
  - Mất mạng khi lưu: báo lỗi, giữ nội dung, bấm lưu lại được.
  - Bấm lưu nhiều lần: chỉ tạo một bộ.
  - Đã nhập mà rời trang: hỏi xác nhận.
- **Test đã có:** `sets.integration`, `set-form.test`, E2E tạo bộ công khai.

## UC-S3. Soạn thẻ từ

- **Việc:** 1.8, 1.11. **Người dùng:** chủ bộ từ. **Trạng thái:** Đủ.
- **Phải có:** thêm, xoá, đổi thứ tự thẻ; từ, nghĩa, phiên âm, ví dụ; bỏ qua dòng trống; chặn ở 2.000 thẻ.
- **Luồng chính:** nhập từng thẻ, thêm thẻ mới, đổi thứ tự, lưu toàn bộ trong một transaction.
- **Ngoại lệ:** thẻ thiếu từ hoặc nghĩa; vượt độ dài; đủ 2.000 thẻ thì khoá nút thêm; `id` thẻ không thuộc bộ bị từ chối.
- **Lưu ý dữ liệu:** thẻ giữ `id` khi sửa để không mất tiến độ học.
- **Test đã có:** `sets-cards.integration`, `card-fields.test`.
- **Test cần thêm:** E2E sửa một thẻ đã học, tiến độ của thẻ vẫn còn.

## UC-S4. Sửa bộ từ

- **Việc:** 1.7, 1.8, 1.11, 1.37, 1.38. **Người dùng:** chủ bộ, ADMIN. **Trạng thái:** Đủ.
- **Phải có:** form điền sẵn, lưu thông tin và thẻ, quay lại chi tiết.
- **Luồng chính:** từ chi tiết bấm "Sửa bộ từ", đổi nội dung, lưu, về chi tiết thấy dữ liệu mới. Nút quay lại của trình duyệt không mở lại form đã lưu.
- **Ngoại lệ:** không có quyền hoặc bộ đã xoá; lỗi khi lưu giữ nguyên nội dung; rời trang khi chưa lưu phải hỏi xác nhận.
- **Test đã có:** `sets.integration`, `sets-cards.integration`, `set-form.test`.
- **Test cần thêm:** E2E sửa rồi kiểm tra chi tiết, danh sách và trang công khai đều mới; người khác mở `/edit` bị từ chối.

## UC-S5. Xem chi tiết bộ từ

- **Việc:** 1.7, 1.12, 1.44, 1.46. **Người dùng:** chủ bộ, người xem bộ công khai. **Trạng thái:** Thiếu (GAP-08, GAP-10).
- **Phải có:**
  - Tên, mô tả, thông tin bộ, danh sách thẻ có phát âm, 4 nút học, nút quay lại.
  - Chủ bộ: sửa, xoá, sao chép đường dẫn khi bộ công khai.
  - Người khác: sao chép về tài khoản.
  - Tiến độ của bộ: số thẻ đã thuộc, đang học, đến hạn.
- **Luồng chính:** mở bộ, xem tiến độ, chọn chế độ học hoặc ôn thẻ đến hạn.
- **Ngoại lệ:** bộ không tồn tại hoặc không có quyền; bộ chưa có thẻ thì ẩn nút học và mời thêm thẻ; lỗi mạng có nút thử lại.
- **Test đã có:** `sets.integration`, `set-detail.test`.
- **Test cần thêm:** integration số liệu tiến độ theo từng người; component nút sao chép đường dẫn, gồm trường hợp trình duyệt chặn clipboard.
- **Còn thiếu:** trạng thái chưa có thẻ hiện chưa có nút đưa tới trang sửa.

## UC-S6. Xoá bộ từ

- **Việc:** 1.7. **Người dùng:** chủ bộ, ADMIN. **Trạng thái:** Đủ.
- **Phải có:** bước xác nhận ngay tại chỗ, xoá mềm, biến mất khỏi danh sách, Khám phá và trang công khai.
- **Luồng chính:** bấm xoá, xác nhận, về `/sets` và thấy thông báo.
- **Ngoại lệ:** huỷ thì trả focus về nút xoá; lỗi API báo bằng thông báo và giữ nguyên trang; người không có quyền nhận 403.
- **Test đã có:** `sets.integration`, `set-detail.test`.
- **Test cần thêm:** E2E xoá rồi mở lại đường dẫn cũ thấy "Không tìm thấy bộ từ".

## UC-S7. Sao chép bộ từ

- **Việc:** 1.9. **Người dùng:** người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:** nút sao chép ở bộ của người khác, bản sao riêng tư thuộc người bấm, tên có thêm "(bản sao)", tiến độ bắt đầu từ đầu.
- **Luồng chính:** mở bộ công khai, bấm sao chép, tới bản sao của mình.
- **Ngoại lệ:** khách được mời đăng nhập rồi quay lại đúng bộ; bộ không còn xem được trả 404; tên dài vẫn hợp lệ sau khi thêm hậu tố.
- **Test đã có:** `sets-duplicate.integration`, `set-detail.test`.
- **Test cần thêm:** E2E tài khoản B sao chép bộ của A, sửa bản sao, bộ gốc không đổi.

## UC-S8. Trang công khai cho khách

- **Việc:** 1.12, 1.46. **Người dùng:** khách, người đã đăng nhập. **Trạng thái:** Thiếu (GAP-10).
- **Phải có:** xem không cần đăng nhập, có metadata cho SEO, nút học thử, mời đăng nhập để sao chép, nút quay lại Khám phá, sao chép đường dẫn.
- **Luồng chính:** mở đường dẫn được chia sẻ, xem thẻ, học thử, đăng nhập để lưu tiến độ.
- **Ngoại lệ:** bộ riêng tư hoặc đã xoá hiện "Không tìm thấy bộ từ" và không được index; người đã đăng nhập thấy nút mở trong tài khoản.
- **Test đã có:** `sets-public.integration`, `public-set.test`, E2E khách học thử.
- **Test cần thêm:** E2E đổi bộ sang riêng tư thì đường dẫn công khai hết hiệu lực, kể cả khi trang đã được cache.

## UC-S9. Khám phá bộ từ công khai

- **Việc:** 1.7, 1.36, 1.42. **Người dùng:** khách, người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:** tìm theo tên, phân trang, từ khoá trên URL, mở trang chi tiết phù hợp với phiên, lối vào từ trang giới thiệu.
- **Luồng chính:** khách từ trang chủ mở Khám phá, tìm, mở bộ, học thử.
- **Ngoại lệ:** không có kết quả có nút xem tất cả; từ khoá quá 100 ký tự; số trang vượt quá; lỗi mạng có nút thử lại.
- **Điều hướng:** khách vào `/explore` được chuyển tới `/public/explore`, người đã đăng nhập ở lại `/explore` với menu đầy đủ.
- **Test đã có:** `sets-public.integration`, `explore-sets.test`, E2E khách tìm và học thử.
- **Test cần thêm:** E2E người đã đăng nhập tìm rồi sao chép.

## UC-S10. Nhập danh sách từ

- **Việc:** 1.21, 1.22, 1.23. **Người dùng:** người đã đăng nhập. **Trạng thái:** Chờ quyết định, cần chọn thư viện đọc Excel.
- **Phải có:**
  - Dán text, tải `.csv`, `.xlsx`, `.txt` tối đa 2 MB.
  - Chọn ký tự phân cách và cột từ, cột nghĩa.
  - Bảng xem trước, báo lỗi từng dòng, sửa hoặc bỏ dòng trước khi lưu.
  - Nhập vào bộ mới hoặc bộ có sẵn.
- **Luồng chính:** đưa dữ liệu vào, xem trước, sửa lỗi, lưu trong một transaction, tới trang bộ từ.
- **Ngoại lệ:**
  - File sai định dạng, sai MIME, quá lớn, rỗng hoặc hỏng.
  - Vượt 2.000 thẻ, tính cả thẻ đang có.
  - Công thức Excel chỉ được đọc như văn bản.
  - Mã hoá UTF-8 có BOM và dấu tiếng Việt phải đúng.
  - Rời trang khi chưa lưu phải hỏi xác nhận.
- **Cách test:** unit từng parser với file mẫu; integration giới hạn file, quyền, transaction; component bảng xem trước; E2E tải CSV, sửa một dòng lỗi, lưu, học ngay.
