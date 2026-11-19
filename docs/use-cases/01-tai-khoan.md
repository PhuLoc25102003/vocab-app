# Use case: tài khoản và phân quyền

## UC-A1. Đăng ký

- **Việc:** 1.1, 1.5. **Người dùng:** khách. **Trạng thái:** Đủ.
- **Phải có:** form tên hiển thị, email, mật khẩu từ 8 ký tự, nút hiện mật khẩu, liên kết sang đăng nhập, giữ tham số `next`.
- **Luồng chính:** khách nhập thông tin, API lưu mật khẩu bằng argon2id và trả 202, web chuyển sang `/login?registered=1` kèm lời nhắc đăng nhập.
- **Ngoại lệ:**
  - Dữ liệu sai: báo lỗi ngay dưới ô nhập.
  - Email đã có: trả cùng kết quả như email mới, không tiết lộ email tồn tại.
  - Quá 3 lần mỗi phút mỗi IP: trả 429 và báo thử lại sau.
  - Người đã đăng nhập vào `/register`: chuyển về trang của họ.
- **Test đã có:** `auth.integration`, `register-form.test`, E2E luồng chính.
- **Test cần thêm:** không.

## UC-A2. Đăng nhập

- **Việc:** 1.1, 1.5. **Người dùng:** khách. **Trạng thái:** Thiếu (GAP-13).
- **Phải có:** form email và mật khẩu, thông báo lỗi chung, đi tiếp tới `next` an toàn, liên kết đăng ký, liên kết quên mật khẩu.
- **Luồng chính:** nhập đúng, API trả access token và đặt cookie refresh, web về `next` hoặc `/dashboard`.
- **Ngoại lệ:**
  - Sai email hoặc mật khẩu: một thông báo chung.
  - Quá 5 lần mỗi phút theo IP và email, hoặc 20 lần theo IP: trả 429.
  - `next` trỏ ra ngoài site: bỏ qua, về `/dashboard`.
  - Mất kết nối API: báo lỗi, giữ nguyên dữ liệu đã nhập.
- **Test đã có:** `auth.integration`, `login-form.test`, `next-path.test`, E2E đăng nhập lại đúng trang.
- **Còn thiếu:** lối vào quên mật khẩu, xem UC-A9.

## UC-A3. Đăng nhập Google

- **Việc:** 1.6. **Người dùng:** khách. **Trạng thái:** Đủ, chưa thử với Client ID thật.
- **Phải có:** nút Google ở đăng nhập và đăng ký, ẩn khi chưa cấu hình `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, API tự xác thực ID token.
- **Luồng chính:** chọn tài khoản Google, API xác thực token, tạo hoặc gộp tài khoản, web về `next`.
- **Ngoại lệ:**
  - Token sai hoặc hết hạn: từ chối, báo lỗi.
  - Email đã xác minh trùng tài khoản mật khẩu: gộp, huỷ mật khẩu cũ và mọi phiên cũ.
  - Script Google không tải được: vẫn đăng nhập được bằng email.
- **Test đã có:** `auth-google.integration`, `google-sign-in.test`.
- **Test cần thêm:** thử thủ công với Client ID thật sau việc 1.20.

## UC-A4. Giữ phiên đăng nhập

- **Việc:** 1.2, 1.5. **Người dùng:** người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:** access token 15 phút chỉ trong bộ nhớ, refresh token 30 ngày trong cookie httpOnly, xoay vòng sau mỗi lần dùng, tự refresh khi gặp 401.
- **Luồng chính:** tải lại trang, web gọi refresh, nhận token mới và hiện đúng trang đang xem.
- **Ngoại lệ:**
  - Refresh token bị dùng lại: thu hồi cả chuỗi phiên.
  - Refresh hết hạn: về đăng nhập, giữ `next`.
  - API không phản hồi: hiện "Không kết nối được máy chủ", không đăng xuất người dùng.
  - Nhiều request cùng gặp 401: chỉ refresh một lần.
- **Test đã có:** `auth-refresh.integration`, `auth-session.integration`, `http.test`, `session.test`, `auth-gate.test`.

## UC-A5. Đăng xuất

- **Việc:** 1.2, 1.40. **Người dùng:** người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:** nút đăng xuất ở thanh trên, nút đăng xuất mọi thiết bị trong trang tài khoản, xoá dữ liệu đã cache của người dùng.
- **Luồng chính:** bấm đăng xuất, API thu hồi phiên, web xoá token và về `/login`.
- **Ngoại lệ:**
  - API lỗi: phiên ở trình duyệt vẫn được xoá.
  - Đăng xuất mọi thiết bị: tăng `tokenVersion`, thiết bị khác bị từ chối ở request kế tiếp.
- **Test đã có:** `auth-session.integration`, E2E đăng xuất.
- **Test cần thêm:** E2E tài khoản khác đăng nhập trên cùng trình duyệt không thấy dữ liệu cũ.

## UC-A6. Bảo vệ trang và phân quyền

- **Việc:** 1.3, 1.5. **Người dùng:** mọi vai trò. **Trạng thái:** Đủ.
- **Phải có:** `AuthGuard` toàn cục, `@Roles`, `@CheckOwnership`, `proxy.ts` điều hướng sớm, `AuthGate` và `Can` ở web.
- **Luồng chính:** khách mở trang riêng, bị chuyển sang `/login?next=...`, đăng nhập xong về đúng trang.
- **Ngoại lệ:**
  - Không có token: 401.
  - Sai vai trò: 403.
  - Bộ từ của người khác không được xem: 404 như không tồn tại.
  - Cookie đánh dấu bị giả: trang vẫn không có dữ liệu vì API từ chối.
- **Test đã có:** `authorization.integration`, `can.test`, `auth-gate.test`, E2E chuyển hướng.

## UC-A7. Xem và sửa tài khoản

- **Việc:** 1.4, 1.40. **Người dùng:** người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:**
  - Trang `/account`, lối vào từ thanh trên, ở 360 px vẫn bấm được.
  - Hiện email, vai trò, tên hiển thị.
  - Form đổi tên.
  - Form đổi mật khẩu gồm mật khẩu hiện tại và mật khẩu mới. Tài khoản chỉ dùng Google không thấy form này.
- **Luồng chính:** sửa tên, bấm lưu, thấy "Đã lưu", tên mới hiện ở mọi nơi. Đổi mật khẩu xong, phiên hiện tại được giữ bằng token mới.
- **Ngoại lệ:**
  - Sai mật khẩu hiện tại: báo lỗi ở đúng ô.
  - Quá 5 lần mỗi phút: 429.
  - Không tải được thông tin: trạng thái lỗi có nút thử lại.
- **Test đã có:** `users.integration`, `account-settings.test`, E2E đổi tên, đổi mật khẩu rồi đăng nhập lại.

## UC-A8. Xoá tài khoản

- **Việc:** 1.4, 1.40. **Người dùng:** người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:** vùng nguy hiểm trong `/account`, nêu rõ dữ liệu bị xoá, bước xác nhận, nhập mật khẩu nếu tài khoản có mật khẩu.
- **Luồng chính:** xác nhận, API xoá hẳn tài khoản, bộ từ, tiến độ, xoá cookie, web về trang đăng nhập và báo đã xoá.
- **Ngoại lệ:**
  - Sai mật khẩu: giữ nguyên tài khoản, báo lỗi.
  - Huỷ xác nhận: không gọi API, trả focus về nút ban đầu.
  - Người khác đang học bộ từ công khai của tài khoản này: phiên của họ báo bộ từ không còn.
- **Test đã có:** `users.integration`, `account-settings.test`, E2E xoá xong không đăng nhập lại được.
- **Test cần thêm:** E2E bộ công khai của tài khoản đã xoá trả 404.

## UC-A9. Quên mật khẩu

- **Việc:** 1.49. **Người dùng:** khách. **Trạng thái:** Chờ quyết định (GAP-13), cần dịch vụ gửi email.
- **Phải có:**
  - `/forgot-password` nhập email, `/reset-password?token=...` đặt mật khẩu mới.
  - Token ngẫu nhiên, chỉ lưu hash, dùng một lần, hết hạn sau 30 phút.
  - Thông báo giống nhau dù email có tồn tại hay không.
- **Luồng chính:** nhập email, nhận thư, mở liên kết, đặt mật khẩu mới, mọi phiên cũ kết thúc, về đăng nhập.
- **Ngoại lệ:** token sai, hết hạn hoặc đã dùng; tài khoản chỉ dùng Google; gửi thư thất bại; vượt rate limit.
- **Cách test:** integration cho vòng đời token và chống dò email, dùng bộ gửi thư giả; component cho hai form; E2E đọc liên kết từ bộ gửi thư giả.
