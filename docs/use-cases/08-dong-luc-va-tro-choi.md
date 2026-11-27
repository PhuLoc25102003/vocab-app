# Use case: động lực học tập và trò chơi

Góp ý ngày 2026-11-27: học sinh thấy ôn từ nhàm chán, cần lý do quay lại mỗi ngày, được nhắc trước khi mất chuỗi, so được với bạn trong lớp và cả app, và có thêm chế độ trò chơi bắn máy bay. Không thêm tab vào thanh điều hướng vì thanh dưới ở 360 px đã đủ 5 ô.

| Mã     | Vấn đề                                                                              | Nguồn | Mức | Việc          |
| ------ | ----------------------------------------------------------------------------------- | ----- | --- | ------------- |
| GAP-37 | Không có phần thưởng ngắn hạn: học xong chỉ thấy điểm phiên, không có XP hay cấp độ | Góp ý | Vừa | 7.1 đến 7.4   |
| GAP-38 | Không so được với người khác trong lớp và cả app                                    | Góp ý | Vừa | 7.5, 7.6      |
| GAP-39 | Không có gì nhắc học sinh quay lại, mất chuỗi là bỏ luôn                            | Góp ý | Cao | 7.3, 7.7–7.10 |
| GAP-40 | Các chế độ học đều dạng hỏi đáp, thiếu chế độ trò chơi có nhịp nhanh                | Góp ý | Vừa | 7.11, 7.12    |

## UC-G1. XP, cấp độ và mục tiêu ngày

- **Việc:** 7.1, 7.2. **Người dùng:** người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:**
  - XP chỉ do server tính từ đáp án đã chấm, client không gửi số XP.
  - Quy tắc nằm trong `@vocab/shared/study/xp.ts` để web hiện trước được số XP dự kiến mà vẫn khớp server.
  - Ngày và tuần tính theo giờ Việt Nam (`Asia/Ho_Chi_Minh`).
  - Mục tiêu ngày chọn 10, 20 hoặc 50 XP, mặc định 20.
- **Luồng chính:** học xong phiên, màn kết quả hiện "+N XP", thanh cấp độ chạy tới mức mới; Tổng quan hiện vòng tròn mục tiêu ngày, đủ thì hiện "Hoàn thành hôm nay".
- **Ngoại lệ:**
  - Khách học thử không có XP, màn kết quả mời đăng ký để lưu XP.
  - Phiên offline gửi lên muộn được tính vào lúc gửi lên, vì hàng đợi offline không gửi kèm thời điểm trả lời.
  - Học lại cùng thẻ đã đúng trong 10 phút không được cộng; vượt trần 500 XP một ngày thì vẫn lưu tiến độ học nhưng XP bằng 0, màn kết quả nói rõ lý do.
  - Gửi lại cùng lô đáp án (thử lại do mạng) không cộng trùng: đáp án trùng đã bị bỏ qua trước khi tính XP.
- **Test:** unit cho quy tắc XP và bảng cấp độ; integration kết thúc phiên cộng đúng XP, gửi lại không cộng trùng, trần ngày; component vòng tròn mục tiêu bốn trạng thái; thủ công giảm chuyển động.

## UC-G2. Chuỗi và thẻ giữ chuỗi

- **Việc:** 7.3. **Người dùng:** người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:** mỗi thứ Hai nhận 1 thẻ, giữ tối đa 2; bỏ lỡ đúng 1 ngày thì tự dùng 1 thẻ; ngày dùng thẻ hiện ❄️ trên lịch 7 ngày.
- **Luồng chính:** học sinh quên học thứ Ba, thứ Tư mở app thấy "Đã dùng thẻ giữ chuỗi hôm qua, chuỗi vẫn là 9 ngày, còn 1 thẻ".
- **Ngoại lệ:** bỏ lỡ 2 ngày liên tiếp mà chỉ còn 1 thẻ thì chuỗi về 0, không dùng thẻ phí; tài khoản mới nhận thẻ đầu tiên ngay khi tạo.
- **Test:** unit tính chuỗi với 0, 1, 2 thẻ và các khoảng trống; integration `GET /stats/overview`.

## UC-G3. Huy hiệu

- **Việc:** 7.4. **Người dùng:** người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:** danh sách huy hiệu và điều kiện trong shared, mỗi huy hiệu chỉ nhận một lần, hiện ở Tài khoản cả huy hiệu chưa có kèm điều kiện và tiến độ.
- **Luồng chính:** học xong phiên đạt điều kiện, màn kết quả hiện thẻ "Huy hiệu mới", Tài khoản thêm huy hiệu đó.
- **Ngoại lệ:** nhiều huy hiệu cùng lúc thì gộp một thông báo; xét lại không tạo bản trùng (khoá duy nhất).
- **Test:** unit điều kiện từng huy hiệu; integration xét huy hiệu sau phiên.

## UC-G4. Bảng xếp hạng

- **Việc:** 7.5, 7.6. **Người dùng:** người đã đăng nhập; giáo viên của lớp. **Trạng thái:** Chưa làm.
- **Phải có:**
  - Xếp theo XP của tuần hiện tại, làm mới lúc 00:00 thứ Hai giờ Việt Nam, xem được tuần trước.
  - Top 50 và hạng của tôi kể cả khi ngoài top 50.
  - Chỉ hiện tên hiển thị và ảnh đại diện, không có email.
  - Người học tự ẩn khỏi bảng chung; giáo viên tắt được bảng của lớp.
- **Luồng chính:** Tổng quan có khối "Xếp hạng tuần", bấm "Xem tất cả" mở `/leaderboard` với tab Toàn app và từng lớp; trang lớp có tab "Xếp hạng".
- **Ngoại lệ:**
  - Người không thuộc lớp gọi xếp hạng lớp nhận 403, lớp không tồn tại nhận 404.
  - Người đã ẩn vẫn thấy hạng của mình (ghi "Chỉ bạn thấy") và vẫn hiện trong bảng lớp.
  - Bảng lớp đã tắt thì học sinh không thấy tab, API trả lỗi nghiệp vụ.
  - Tài khoản bị khoá không hiện trên bảng.
  - Bằng XP thì người đạt sớm hơn đứng trên.
- **Test:** integration quyền xem lớp, ẩn tên, tuần theo giờ Việt Nam; component bốn trạng thái; thủ công 360 px.

## UC-G5. Nhắc học miễn phí

- **Việc:** 7.7 đến 7.10. **Người dùng:** người đã đăng nhập; hệ thống. **Trạng thái:** Chưa làm.
- **Phải có:**
  - Job chạy lúc 20:00 giờ Việt Nam do GitHub Actions gọi, vì Render gói Free ngủ khi rảnh nên hẹn giờ trong API không chạy đúng giờ.
  - Endpoint job chỉ chạy khi header bí mật đúng; chạy lại trong ngày không gửi trùng.
  - Web Push là kênh chính (miễn phí, không giới hạn); mail Brevo free (khoảng 300 mail mỗi ngày) là dự phòng.
  - Mỗi người tối đa 1 thông báo đẩy và 1 mail mỗi ngày, gộp nội dung.
  - Người học bật tắt được từng loại theo từng kênh; mail có link huỷ nhận.
  - Chỉ xin quyền thông báo sau khi người học tự bấm hoặc học xong phiên đầu tiên.
- **Luồng chính:** 20:00 học sinh có chuỗi 9 ngày chưa học hôm nay nhận thông báo "Chuỗi 9 ngày sắp mất, còn 12 thẻ cần ôn"; bấm vào mở Ôn hôm nay.
- **Ngoại lệ:**
  - Thiếu khoá VAPID hoặc Brevo thì kênh đó tắt, app vẫn chạy và ghi log.
  - Dịch vụ đẩy trả 404 hoặc 410 thì xoá đăng ký.
  - Gần hết hạn mức mail thì bỏ loại ưu tiên thấp, luôn giữ 50 mail cho quên mật khẩu.
  - Người đã học hôm nay hoặc đã tắt loại nhắc đó thì không nhận.
  - Trình duyệt chặn quyền thì hiện hướng dẫn mở lại trong cài đặt; iPhone chưa thêm vào màn hình chính thì hiện hướng dẫn thêm.
  - Link huỷ nhận hết hạn hoặc sai chữ ký thì báo lỗi, không đổi cài đặt.
- **Test:** unit chọn người cần nhắc và xếp ưu tiên; integration endpoint job (thiếu hoặc sai secret bị từ chối, chạy hai lần không gửi trùng) với bộ gửi giả; component cài đặt thông báo; thủ công nhận thông báo trên Android và iPhone.

## UC-G6. Chế độ Mưa từ

- **Việc:** 7.11, 7.12a, 7.12b, 7.12c, 7.12d. **Người dùng:** người học, kể cả khách học thử (không lưu điểm cao). **Trạng thái:** Chưa làm.
- **Phải có:**
  - Nghĩa rơi từ trên xuống trên drone địch, người học trả lời bằng từ tiếng Anh tương ứng để chiến đấu cơ bắn nổ. Có hai kiểu chơi chọn ở màn bắt đầu: **Gõ** và **Nói**.
  - Kiểu Gõ: gõ chữ đầu thì khoá mục tiêu khớp gần đáy nhất; mỗi ký tự đúng bắn một tia laser, đủ từ thì nổ.
  - Kiểu Nói: đọc to từ, nhận dạng giọng nói khớp với bất kỳ mục tiêu nào đang rơi thì bắn mục tiêu gần đáy nhất có từ đó; hiện chữ vừa nghe được; tốc độ rơi chậm hơn kiểu Gõ để bù độ trễ nhận dạng; chấm theo quy tắc của chế độ Luyện nói.
  - Điểm cao tính riêng cho từng kiểu chơi.
  - 3 khiên, đợt 10 mục tiêu nhanh dần, mục tiêu lớn sau mỗi 3 đợt, combo nhân điểm.
  - Điểm cao nhất theo từng bộ.
  - Chiến đấu cơ và hiệu ứng vẽ chi tiết, hiện đại, chỉ dùng màu từ design token, đúng light và dark.
  - Đạt 60 fps trên điện thoại tầm trung, tự giảm hiệu ứng khi tụt khung hình.
  - Chơi được ở 360 px với bàn phím ảo; tôn trọng `prefers-reduced-motion`; âm thanh theo công tắc có sẵn.
  - Thiết kế đồ hoạ là của riêng app, không sao chép nhân vật, hình ảnh hay giao diện của trò chơi có sẵn.
- **Luồng chính:** chọn Mưa từ trong lưới chế độ, xem luật và điểm cao, bấm Bắt đầu, chơi đến khi hết khiên hoặc hết từ, màn kết quả hiện điểm, "Kỷ lục mới" nếu có, XP và danh sách từ bị lọt kèm nút học lại.
- **Ngoại lệ:**
  - Bộ dưới 4 thẻ thì thẻ chế độ bị khoá kèm lý do.
  - Rời tab hoặc bấm `Esc` thì tạm dừng.
  - Tải lại trang giữa chừng thì phiên học được giữ như các chế độ khác, ván chơi bắt đầu lại.
  - Mất mạng khi kết thúc thì kết quả vào hàng đợi offline như Flashcard.
  - Từ có dấu cách hoặc dấu gạch nối vẫn gõ được.
  - Kiểu Nói: trình duyệt không hỗ trợ nhận dạng giọng nói (Firefox, một số WebView như Zalo) thì ẩn lựa chọn Nói và mở modal hướng dẫn trình duyệt có sẵn; chỉ xin quyền micro khi người học chọn Nói; bị chặn micro hoặc mất nhận dạng giữa ván thì tạm dừng và cho đổi sang kiểu Gõ mà không mất điểm đang có; tiếng ồn ra chữ không khớp mục tiêu nào thì bỏ qua, không trừ combo.
- **Test:** unit cho lõi trò chơi (khoá mục tiêu, va chạm, đợt, combo, điểm, khớp kết quả nhận dạng với mục tiêu) chạy bằng đồng hồ giả; component kiểu Nói với bộ nhận dạng giả; integration lưu điểm cao chỉ khi cao hơn; component màn bắt đầu và kết quả; E2E chơi một đợt bằng bàn phím; thủ công 360 px, dark, giảm chuyển động, đo fps.
