# Use case: học tập và ôn tập

## UC-L1. Lõi học dùng chung

- **Việc:** 1.13. **Người dùng:** web và API. **Trạng thái:** Đủ.
- **Phải có:** kiểu `Question`, `GradeResult`; registry chế độ học; chấm điểm và SRS trong `@vocab/shared`, không phụ thuộc React hay NestJS.
- **Quy tắc chấm:** không phân biệt hoa thường, bỏ khoảng trắng thừa, giữ nguyên dấu tiếng Việt và chuẩn hoá về NFC.
- **Quy tắc SRS:** đúng lần đầu ôn sau 1 ngày, lần hai sau 6 ngày, sau đó nhân hệ số dễ, tối đa 365 ngày. Sai thì ôn lại sau 10 phút.
- **Ngoại lệ:** chế độ chưa đăng ký báo lỗi; trả lời trước hạn không làm khoảng ôn tăng.
- **Test đã có:** unit cho `grading`, `srs`, `stats`, `registry` và từng chế độ.

## UC-L2. Chạy một phiên học

- **Việc:** 1.14, 1.15, 1.39. **Người dùng:** người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:**
  - Bắt đầu phiên, thanh tiến độ, nút thoát.
  - Server tự chấm lại, không tin kết quả từ client.
  - Gửi đáp án theo lô, tối đa 200 mỗi lô, không chặn việc học khi lỗi mạng.
  - Giữ tiến độ khi tải lại, đóng tab hoặc mất mạng.
- **Luồng chính:** chọn chế độ, nhận câu hỏi, trả lời từng câu, đáp án được gửi nền, câu cuối xong thì kết thúc phiên và hiện kết quả.
- **Ngoại lệ:**
  - Bộ không có thẻ, không có quyền, không còn thẻ đến hạn: trạng thái riêng có nút quay lại.
  - Gửi lại cùng đáp án: không tính hai lần.
  - Phiên đã kết thúc: từ chối đáp án mới.
  - Token hết hạn giữa phiên: tự refresh và học tiếp.
  - Bộ bị xoá hoặc sửa giữa phiên: câu không còn hợp lệ bị bỏ qua, không làm hỏng phiên.
- **Test đã có:** `study-sessions.integration`, `study-shell.test`, `session.store.test`.
- **Cách giữ tiến độ:** phiên và hàng đợi đáp án nằm trong `sessionStorage` của tab tối đa 12 giờ, xoá khi đăng xuất. Đáp án gửi bằng `keepalive`, server bỏ qua đáp án gửi lại y hệt.
- **Test cần thêm:** E2E đóng trang rồi xem thống kê; E2E mất mạng rồi có mạng lại.

## UC-L3. Xem kết quả phiên

- **Việc:** 1.15, 1.45. **Người dùng:** người học. **Trạng thái:** Đủ.
- **Phải có:** số câu đúng trên tổng, danh sách từ cần ôn, nút học lại toàn bộ, nút học lại thẻ sai, nút về bộ từ.
- **Luồng chính:** học xong, xem kết quả, học lại thẻ sai hoặc quay về.
- **Ngoại lệ:** gửi kết quả lỗi thì có nút thử lại và không mất đáp án; đúng hết thì ẩn nút học lại thẻ sai.
- **Quy tắc điểm:** tính theo lần trả lời đầu tiên của mỗi thẻ.
- **Test đã có:** `study-sessions.integration`, `study-shell.test`, E2E chế độ Viết, kể cả học lại thẻ sai ở component và thẻ phải thuộc bộ từ ở API.

## UC-L4. Chế độ Flashcard

- **Việc:** 1.16. **Người dùng:** người học. **Trạng thái:** Đủ.
- **Phải có:** mặt trước và mặt sau, lật bằng bấm hoặc Space, "Chưa nhớ" phím 1, "Đã nhớ" phím 2, phát âm từng mặt.
- **Luồng chính:** xem từ, lật thẻ, tự đánh giá, sang thẻ tiếp.
- **Ngoại lệ:** không chấm khi chưa lật; phím tắt không chạy khi đang focus nút khác; `prefers-reduced-motion` tắt hiệu ứng lật; từ rất dài không tràn ở 360 px.
- **Test đã có:** `flashcard-mode.test`, unit chế độ, E2E khách học thử.
- **Test cần thêm:** E2E tài khoản học bằng bàn phím và tiến độ được lưu.

## UC-L5. Khách học thử

- **Việc:** 1.16. **Người dùng:** khách. **Trạng thái:** Đủ.
- **Phải có:** học 4 chế độ trên bộ công khai, chấm trên trình duyệt, không gửi dữ liệu học lên API, lời mời đăng nhập ở kết quả.
- **Luồng chính:** mở trang công khai, học thử, xem kết quả, đăng nhập và quay lại đúng chế độ.
- **Ngoại lệ:** bộ không còn công khai hiện "Không tìm thấy"; tải lại thì bắt đầu lại, điều này chấp nhận được với khách.
- **Test đã có:** `guest-backend.test`, E2E khách học thử không gửi request ghi.

## UC-L6. Phát âm

- **Việc:** 1.17. **Người dùng:** mọi người. **Trạng thái:** Đủ, chưa nghe thử bằng tai.
- **Phải có:** nút nghe ở thẻ và câu hỏi, đọc đúng ngôn ngữ của từ hoặc nghĩa, ẩn nút khi trình duyệt không hỗ trợ.
- **Ngoại lệ:** máy không có giọng đọc của ngôn ngữ đó; bấm liên tục thì huỷ câu đang đọc; rời trang thì dừng đọc.
- **Test đã có:** `audio-button.test`.
- **Test thủ công:** Chrome, Edge, Safari iOS, Chrome Android với tiếng Anh và tiếng Việt.

## UC-L7. Chế độ Viết

- **Việc:** 1.24. **Người dùng:** người học. **Trạng thái:** Đủ.
- **Phải có:** hiện nghĩa, ô nhập từ, Enter để kiểm tra, báo đúng sai bằng chữ và icon, gạch đỏ phần sai, hiện đáp án đúng.
- **Ngoại lệ:** ô trống không gửi được; đáp án khác hoa thường vẫn đúng; thiếu dấu là sai; từ nhiều chữ và ký tự đặc biệt.
- **Test đã có:** `typed-answer.test`, unit `write`, E2E.

## UC-L8. Chế độ Nghe viết

- **Việc:** 1.25. **Người dùng:** người học. **Trạng thái:** Đủ.
- **Phải có:** tự đọc từ khi vào câu, nút nghe lại, ô nhập, chấm như chế độ Viết, không lộ đáp án trên màn hình trước khi chấm.
- **Ngoại lệ:** trình duyệt không hỗ trợ phát âm thì báo rõ và mời chọn chế độ khác; trình duyệt chặn tự phát thì vẫn có nút nghe.
- **Test đã có:** `dictation-mode.test`, unit `dictation`.
- **Test cần thêm:** E2E với `speechSynthesis` giả. Thủ công trên điện thoại.

## UC-L9. Chế độ Trắc nghiệm

- **Việc:** 1.26. **Người dùng:** người học. **Trạng thái:** Đủ.
- **Phải có:** 4 lựa chọn lấy từ các thẻ khác, không trùng nhau, chọn bằng bấm hoặc phím số, báo đúng sai rồi sang câu.
- **Ngoại lệ:** bộ quá ít thẻ thì có ít lựa chọn hơn; các thẻ trùng nghĩa không tạo hai đáp án giống nhau; không đổi đáp án sau khi đã chấm.
- **Test đã có:** `mcq-mode.test`, unit `mcq`.
- **Test cần thêm:** E2E bộ 1 thẻ và bộ nhiều thẻ.

## UC-L10. Ôn hôm nay

- **Việc:** 1.13, 1.27, 1.45. **Người dùng:** người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:** tổng số thẻ đến hạn, danh sách bộ có thẻ đến hạn, phân trang, chọn chế độ ôn, phiên chỉ gồm thẻ đến hạn.
- **Luồng chính:** mở trang, chọn bộ và chế độ, ôn xong thì số thẻ giảm.
- **Ngoại lệ:** không có thẻ đến hạn thì mời học thêm; ôn xong hết thì báo đã xong; bộ đã xoá không xuất hiện; thẻ sai sẽ quay lại sau 10 phút.
- **Test đã có:** `review-due.integration`, `due-sets.test`.
- **Test cần thêm:** E2E đặt thẻ đến hạn trong database test, ôn xong danh sách cập nhật.

## UC-L11. Thống kê

- **Việc:** 1.28, 1.44. **Người dùng:** người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:** chuỗi ngày học, số từ đã thuộc, số câu hôm nay, từ hay sai, số thẻ đến hạn kèm nút "Ôn ngay".
- **Quy tắc:** ngày tính theo giờ Việt Nam. Từ đã thuộc có khoảng ôn từ 6 ngày. Chưa học hôm nay vẫn giữ chuỗi nếu hôm qua có học.
- **Ngoại lệ:** chưa học gì thì mời bắt đầu; lỗi mạng có nút thử lại; bộ đã xoá không nằm trong từ hay sai.
- **Test đã có:** `stats.integration`, `stats-overview.test`, unit `stats`, E2E.
- **Test cần thêm:** integration ranh giới 0 giờ Việt Nam.

## UC-L12. Âm thanh khi trả lời đúng

- **Việc:** 5.24. **Người dùng:** mọi người, kể cả khách học thử. **Trạng thái:** Đủ, chưa nghe thử bằng tai trên điện thoại.
- **Phải có:** một tiếng chuông ngắn (hai nốt đi lên, dưới 0,3 giây, âm lượng nhỏ) ngay khi đáp án được chấm đúng ở Flashcard (bấm "Đã nhớ"), Học kỹ, Viết, Nghe viết, Điền từ, Trắc nghiệm, Ghép cặp (mỗi cặp đúng) và Luyện nói. Trả lời sai không phát âm thanh để không làm nản. Bật tắt ở Tài khoản, mục "Giọng đọc và âm thanh", lưu trên thiết bị, mặc định bật; bật lên thì phát thử một lần.
- **Quy tắc:** Kiểm tra không phát âm thanh trong lúc làm vì sẽ lộ đáp án. Âm thanh tạo bằng Web Audio, không tải file. Âm thanh chỉ là phản hồi phụ, màu, icon và chữ "Chính xác" vẫn giữ nguyên.
- **Ngoại lệ:** trình duyệt không có Web Audio thì ẩn nút bật tắt và không phát; localStorage bị chặn thì coi như bật; lỗi phát âm thanh không làm hỏng phiên học.
- **Test đã có:** `sound.test`, `mcq-mode.test`.
- **Test thủ công:** Chrome Android, Safari iOS (chế độ im lặng), Chrome máy tính.
