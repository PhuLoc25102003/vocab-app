# API

Nguồn: tách từ `spec-source.md`, đã đối chiếu với code. REST, tiền tố `/api/v1`, cổng local 4000.

**Đã có:** `GET /health`, `POST /auth/register`, `POST /auth/login`, `POST /auth/google`, `POST /auth/google/redirect`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/logout-all`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET`, `PATCH`, `DELETE /users/me`, các endpoint `/sets`, `/study/sessions`, `GET /review/due`, `GET /stats/overview`. Các endpoint còn lại là hợp đồng cần làm theo.

## Danh sách endpoint

| Method | Path                                           | Quyền                     | Mô tả                                                      |
| ------ | ---------------------------------------------- | ------------------------- | ---------------------------------------------------------- |
| POST   | /auth/register                                 | Công khai                 | Đăng ký email + mật khẩu, trả 202                          |
| POST   | /auth/login                                    | Công khai                 | Trả access token, đặt cookie refresh                       |
| POST   | /auth/google                                   | Công khai                 | Đăng nhập bằng Google ID token                             |
| POST   | /auth/google/redirect                          | Công khai                 | Nhận kết quả đăng nhập Google ở chế độ redirect (mobile)   |
| POST   | /auth/refresh                                  | Cookie refresh            | Cấp cặp token mới (rotation)                               |
| POST   | /auth/logout                                   | Đã đăng nhập              | Thu hồi refresh session hiện tại                           |
| POST   | /auth/logout-all                               | Đã đăng nhập              | Tăng `tokenVersion`, đăng xuất mọi thiết bị                |
| POST   | /auth/forgot-password                          | Công khai                 | Gửi email liên kết đặt lại mật khẩu, trả 202               |
| POST   | /auth/reset-password                           | Công khai                 | Đặt mật khẩu mới bằng token trong email                    |
| GET    | /users/me                                      | Đã đăng nhập              | Thông tin tài khoản                                        |
| PATCH  | /users/me                                      | Đã đăng nhập              | Sửa tên, mật khẩu                                          |
| DELETE | /users/me                                      | Đã đăng nhập              | Xoá hẳn tài khoản và dữ liệu                               |
| GET    | /sets                                          | Đã đăng nhập              | Bộ từ của tôi, phân trang                                  |
| GET    | /sets/public                                   | Công khai                 | Tìm bộ từ công khai                                        |
| POST   | /sets                                          | STUDENT+                  | Tạo bộ từ kèm danh sách thẻ                                |
| GET    | /sets/:id                                      | Chủ, ADMIN hoặc bộ PUBLIC | Chi tiết + thẻ                                             |
| PATCH  | /sets/:id                                      | Chủ, ADMIN                | Sửa thông tin                                              |
| DELETE | /sets/:id                                      | Chủ, ADMIN                | Xoá mềm                                                    |
| POST   | /sets/:id/duplicate                            | Đã đăng nhập              | Sao chép bộ từ xem được về tài khoản                       |
| PUT    | /sets/:id/cards                                | Chủ, ADMIN                | Lưu toàn bộ thẻ (thêm, sửa, xoá, đổi thứ tự)               |
| GET    | /folders                                       | Đã đăng nhập              | Thư mục của tôi kèm số bộ từ                               |
| POST   | /folders                                       | Đã đăng nhập              | Tạo thư mục                                                |
| PATCH  | /folders/:id                                   | Chủ                       | Đổi tên thư mục                                            |
| DELETE | /folders/:id                                   | Chủ                       | Xoá thư mục, giữ bộ từ                                     |
| GET    | /classes                                       | TEACHER, ADMIN            | Lớp tôi dạy kèm số thành viên, tìm và sắp xếp              |
| POST   | /classes                                       | TEACHER, ADMIN            | Tạo lớp, server sinh mã tham gia                           |
| GET    | /classes/:id                                   | Giáo viên của lớp, ADMIN  | Chi tiết lớp                                               |
| PATCH  | /classes/:id                                   | Giáo viên của lớp, ADMIN  | Sửa tên, mô tả, lưu trữ hoặc mở lại lớp                    |
| POST   | /classes/:id/join-code                         | Giáo viên của lớp, ADMIN  | Đổi mã tham gia                                            |
| POST   | /classes/join                                  | Đã đăng nhập              | Tham gia lớp bằng mã                                       |
| GET    | /classes/joined                                | Đã đăng nhập              | Lớp tôi đã tham gia                                        |
| GET    | /classes/assignments                           | Đã đăng nhập              | Bài cần làm ở các lớp đã tham gia, kèm trạng thái          |
| DELETE | /classes/:id/members/me                        | Thành viên                | Rời lớp                                                    |
| GET    | /classes/:id/members                           | Giáo viên của lớp, ADMIN  | Thành viên của lớp                                         |
| GET    | /classes/:id/members/:userId                   | Giáo viên của lớp, ADMIN  | Một học sinh: tên, ngày vào lớp, số liệu bài giao          |
| DELETE | /classes/:id/members/:userId                   | Giáo viên của lớp, ADMIN  | Xoá học sinh khỏi lớp                                      |
| GET    | /classes/:id/assignments                       | Giáo viên của lớp, ADMIN  | Bài đã giao: lọc còn hạn, hết hạn, tìm, sắp xếp, x/y nộp   |
| POST   | /classes/:id/assignments                       | Giáo viên của lớp, ADMIN  | Giao bộ từ kèm chế độ và hạn nộp                           |
| DELETE | /classes/:id/assignments/:assignmentId         | Giáo viên của lớp, ADMIN  | Huỷ bài giao                                               |
| GET    | /classes/:id/assignments/:assignmentId/summary | Giáo viên của lớp, ADMIN  | Số liệu cả lớp của bài giao                                |
| GET    | /classes/:id/assignments/:assignmentId/results | Giáo viên của lớp, ADMIN  | Kết quả từng học sinh của bài giao                         |
| GET    | /classes/:id/members/:userId/results           | Giáo viên của lớp, ADMIN  | Kết quả một học sinh qua các bài giao của lớp              |
| GET    | /teacher/overview                              | TEACHER, ADMIN            | Tổng quan giáo viên của các lớp đang dạy                   |
| GET    | /admin/users                                   | ADMIN                     | Danh sách người dùng, tìm, lọc vai trò và trạng thái       |
| PATCH  | /admin/users/:id/lock                          | ADMIN                     | Khoá tài khoản kèm lý do, huỷ mọi phiên                    |
| PATCH  | /admin/users/:id/unlock                        | ADMIN                     | Mở khoá tài khoản                                          |
| PATCH  | /admin/users/:id/role                          | ADMIN                     | Đổi vai trò, ví dụ cấp giáo viên                           |
| GET    | /admin/stats                                   | ADMIN                     | Số người dùng, tài khoản khoá, bộ từ, bộ bị ẩn             |
| PATCH  | /admin/sets/:id/hide                           | ADMIN                     | Ẩn bộ từ vi phạm kèm lý do                                 |
| PATCH  | /admin/sets/:id/unhide                         | ADMIN                     | Bỏ ẩn bộ từ                                                |
| POST   | /import/preview                                | Đã đăng nhập              | Phân tích text/CSV/XLSX, trả danh sách thẻ + lỗi từng dòng |
| POST   | /sets/:id/import                               | Chủ                       | Lưu kết quả đã xem trước                                   |
| GET    | /uploads/config                                | Đã đăng nhập              | Tải ảnh đã bật chưa, giới hạn ảnh                          |
| POST   | /uploads/presign                               | Đã đăng nhập              | URL ký sẵn 5 phút để tải ảnh lên R2                        |
| POST   | /study/sessions                                | Đã đăng nhập              | Bắt đầu phiên, trả câu hỏi theo mode                       |
| POST   | /study/sessions/:id/answers                    | Chủ phiên                 | Gửi đáp án theo lô, cập nhật SRS                           |
| PATCH  | /study/sessions/:id/finish                     | Chủ phiên                 | Kết thúc, trả kết quả                                      |
| GET    | /review/due                                    | Đã đăng nhập              | Thẻ đến hạn ôn hôm nay                                     |
| GET    | /stats/sets/:id                                | Người xem được bộ từ      | Tiến độ của tôi trong bộ từ                                |
| GET    | /stats/overview                                | Đã đăng nhập              | Streak, số từ đã thuộc, từ hay sai                         |
| GET    | /health                                        | Công khai                 | Kiểm tra API + kết nối DB                                  |
| GET    | /admin/users                                   | ADMIN                     | Quản lý người dùng                                         |

## Chuẩn request / response

Thành công:

```json
{ "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 135 } }
```

Lỗi (do `AllExceptionsFilter` trả về):

```json
{
  "error": {
    "code": "SET_NOT_FOUND",
    "message": "Không tìm thấy bộ từ",
    "details": null,
    "requestId": "2588e441-3816-4766-9bc0-330bd1ffba53"
  }
}
```

- Mã HTTP: 400 sai dữ liệu, 401 chưa đăng nhập / token hết hạn, 403 không đủ quyền, 404 không tìm thấy, 409 trùng, 422 lỗi nghiệp vụ, 429 quá giới hạn, 503 dịch vụ phụ thuộc không sẵn sàng.
- `code` viết hoa, định nghĩa trong `packages/shared/src/errors.ts` để FE dịch thành thông báo.
- Phân trang: `?page=1&limit=20&sort=-updatedAt`, `page` tối đa 100.000, `limit` tối đa 100.
- Tài liệu API sinh tự động bằng `@nestjs/swagger` tại `/api/docs`, bản JSON tại `/api/docs-json`. Hai đường dẫn này nằm ngoài `/api/v1` và tắt khi `NODE_ENV=production`.
- Khi cần đổi hợp đồng API, tạo `/api/v2`, không sửa ngầm `/v1`.

## Đăng ký và đăng nhập

- `POST /auth/register` nhận `{ email, password, displayName }`, luôn trả 202 `{ "data": { "status": "accepted" } }` khi dữ liệu hợp lệ, kể cả khi email đã có. Tài khoản cũ không bị đổi. Giao diện chuyển người dùng sang trang đăng nhập.
- `POST /auth/login` nhận `{ email, password }`, trả 200 `{ "data": { "user": { id, email, displayName, role }, "accessToken": "..." } }` và đặt cookie `refresh_token`. Mọi trường hợp sai trả 401 `INVALID_CREDENTIALS` với cùng thông báo.
- `POST /auth/google` nhận `{ credential }` là Google ID token, trả 200 cùng dạng với đăng nhập. Lần đầu tạo tài khoản `STUDENT` không có mật khẩu, các lần sau nhận ra người dùng theo Google ID. Token không hợp lệ hoặc email Google chưa xác minh trả 401 `GOOGLE_TOKEN_INVALID`. Email trùng tài khoản mật khẩu thì gộp vào tài khoản đó, đồng thời xoá mật khẩu cũ và kết thúc mọi phiên cũ. Email đã gắn với Google ID khác trả 409 `GOOGLE_EMAIL_IN_USE`. Chưa đặt `GOOGLE_CLIENT_ID` hoặc không tải được khoá của Google trả 503. `Origin` ngoài `CORS_ORIGINS` trả 403.
- `POST /auth/google/redirect` là `login_uri` của nút Google ở chế độ redirect, dùng trên màn hình cảm ứng và PWA đã cài. Google POST form `application/x-www-form-urlencoded` có `credential`. API kiểm tra token như `POST /auth/google`, thêm điều kiện claim `nonce` khớp cookie `google_nonce`, rồi xoá cookie đó. Không kiểm tra `Origin` vì form đến từ `accounts.google.com`. Luôn trả 303 về `<WEB_ORIGIN>/login`: thành công thì kèm `?google=done` và đặt cookie refresh, web gọi `POST /auth/refresh` để lấy phiên; lỗi thì kèm `?google_error=<mã lỗi>`.
- `POST /auth/refresh` đọc cookie, trả 200 cùng dạng với đăng nhập và đặt cookie mới. Cookie sai hoặc phiên đã thu hồi trả 401 `REFRESH_TOKEN_INVALID` và xoá cookie. Request khác vừa xoay vòng cùng token trả 409 `REFRESH_IN_PROGRESS`, cookie giữ nguyên, client gửi lại một lần. `Origin` ngoài `CORS_ORIGINS` trả 403.
- `POST /auth/logout` và `POST /auth/logout-all` cần access token, trả 204 và xoá cookie.
- `POST /auth/forgot-password` nhận `{ email }`, luôn trả 202 `{ "data": { "message": "..." } }` cùng một thông báo, dù email có tài khoản hay không. Tài khoản tồn tại và chưa bị khoá thì nhận email có liên kết `${WEB_ORIGIN}/reset-password?token=...`, sống 30 phút. Liên kết mới làm liên kết cũ hết hiệu lực. Chưa cấu hình Brevo thì API dùng bộ gửi thư trong bộ nhớ, chỉ ghi log cảnh báo.
- `POST /auth/reset-password` nhận `{ token, password }`, trả 200 `{ "data": { "message": "..." } }`, kết thúc mọi phiên cũ. Token sai, hết hạn hoặc đã dùng trả 400 `RESET_TOKEN_INVALID`. Hai endpoint dùng chung giới hạn tần suất với đăng ký.
- Route cần đăng nhập trả 401 `TOKEN_EXPIRED` khi access token hết hạn, 401 `UNAUTHORIZED` khi thiếu hoặc sai token.
- Vượt giới hạn trả 429 `TOO_MANY_REQUESTS` kèm header `Retry-After` (giây).

## Tài khoản

- `GET /users/me` trả `{ "data": { "user": { id, email, displayName, role, hasPassword } } }`.
- `PATCH /users/me` nhận `displayName`, hoặc `currentPassword` cùng `newPassword`. Khi đổi mật khẩu, mọi phiên cũ kết thúc, response có thêm `accessToken` và cookie refresh mới cho thiết bị đang dùng. Sai mật khẩu hiện tại trả 422 `WRONG_PASSWORD`.
- `DELETE /users/me` nhận `{ password }`, trả 204 và xoá cookie. Tài khoản không có mật khẩu không cần gửi `password`.
- Xoá tài khoản xoá luôn bộ từ của người đó, kèm tiến độ và phiên học của người khác trên các bộ từ này.
- `PATCH` và `DELETE` giới hạn 5 lần/phút cho mỗi tài khoản.

## Bộ từ

- `GET /sets` và `GET /sets/public` sắp xếp theo `updatedAt`, `createdAt`, `title`, thêm `-` để giảm dần. Cả hai nhận thêm `q` để tìm theo tên.
- `POST /sets` nhận `{ title, description?, termLang?, defLang?, visibility?, cards? }`, trả 201. Mỗi thẻ gồm `term`, `definition`, `phonetic?`, `example?`. Body tối đa 5 MB.
- `GET /sets/:id` trả bộ từ kèm `owner.displayName` và `cards`. Khách và người dùng khác xem được bộ `PUBLIC`. Bộ không được xem trả 404 như bộ không tồn tại. Bộ `CLASS` xem và học được bởi chủ, ADMIN, giáo viên và thành viên của lớp chưa lưu trữ đã được giao bộ đó; người khác nhận 404. Bộ `CLASS` không có trong Khám phá.
- `PATCH` và `DELETE /sets/:id` dành cho chủ hoặc ADMIN. `DELETE` là xoá mềm, trả 204. Sau 30 ngày bộ từ bị xoá hẳn và không khôi phục được.
- `PUT /sets/:id/cards` dành cho chủ hoặc ADMIN, nhận `{ cards }` là toàn bộ danh sách theo thứ tự mới, tối đa 2.000 thẻ, body tối đa 5 MB. Thẻ có `id` được giữ và cập nhật, thẻ không có `id` được tạo mới, thẻ đang có mà không gửi lên bị xoá cùng tiến độ học của thẻ đó. `phonetic`, `example` không gửi lên sẽ bị xoá. Trả 200 kèm bộ từ và `cards`. `id` không thuộc bộ từ trả 422 `CARD_NOT_IN_SET` và không đổi gì.
- `POST /sets/:id/duplicate` sao chép bộ từ người gọi xem được về tài khoản của họ, trả 201 kèm thông tin bộ mới. Bản sao có tên thêm ` (bản sao)`, luôn `PRIVATE`, gồm toàn bộ thẻ với `id` mới, không kèm thư mục và tiến độ học. Bộ không xem được trả 404.
- `PATCH /sets/:id` nhận thêm `folderId`: id thư mục của chủ bộ từ, hoặc `null` để đưa ra khỏi thư mục. Thư mục không tồn tại hoặc của người khác trả 404 `FOLDER_NOT_FOUND`, kể cả khi ADMIN sửa thay. `GET /sets` nhận `folderId` là id thư mục hoặc `none` (bộ chưa vào thư mục nào).
- Có Upstash Redis thì `GET /sets/:id` của bộ `PUBLIC` chưa bị ẩn được cache 5 phút cho người không phải chủ và không phải ADMIN (việc 2.2, khoá `set:public:<id>`). Sửa bộ, đổi phạm vi, lưu hoặc nhập thẻ, xoá bộ, ADMIN ẩn hoặc bỏ ẩn đều xoá cache của bộ đó; chủ đổi tên hoặc xoá tài khoản thì xoá cache mọi bộ của người đó. Bộ `CLASS` và `PRIVATE` không được cache. Thiếu Redis hoặc Redis lỗi thì đọc database.
- `folderId` chỉ có trong dữ liệu trả cho chủ bộ từ, không có ở `GET /sets/public` và `GET /sets/:id` khi người khác xem.

## Thư mục

- `GET /folders` nhận `page`, `limit`, trả thư mục của người gọi xếp theo tên: `{ data: [{ id, name, setCount }], meta }`. `setCount` chỉ đếm bộ chưa xoá.
- `POST /folders` nhận `{ name }` (1 đến 60 ký tự), trả 201. `PATCH /folders/:id` nhận `{ name }`, trả 200. Tên trùng với thư mục khác của cùng người, không phân biệt hoa thường, trả 409 `FOLDER_NAME_TAKEN`.
- `DELETE /folders/:id` trả 204, bộ từ bên trong được giữ lại với `folderId` là `null`.
- Lớp trả về dạng `{ id, name, description, joinCode, archivedAt, createdAt, memberCount }`. STUDENT gọi `/classes` nhận 403. Lớp không tồn tại trả 404 `CLASS_NOT_FOUND`, lớp của giáo viên khác trả 403.
- `GET /classes` nhận `page`, `limit`, `archived` (`false` mặc định, `true` chỉ lấy lớp đã lưu trữ), xếp lớp mới tạo trước. Mỗi lớp có thêm `openAssignmentCount` (bài chưa tới hạn hoặc không hạn) và `onTimeRate` (việc 5.16a): phần trăm bài nộp đúng hạn trong 30 ngày qua trên số cặp bài hết hạn và học sinh đang trong lớp vào trước hạn, `null` khi chưa có bài hết hạn. Việc 5.33 thêm `q` (tìm trong tên lớp, không phân biệt hoa thường) và `sort` (`-createdAt` mặc định, `name` theo tên, `-memberCount` sĩ số lớn trước).
- `POST /classes` nhận `{ name, description? }` (tên 1 đến 80 ký tự, mô tả tối đa 500), trả 201. Server sinh `joinCode` 6 ký tự từ bảng chữ không có I, O, 0, 1. `teacherId` luôn là người gọi.
- `PATCH /classes/:id` nhận ít nhất một trong `{ name, description, archived }`. Mô tả rỗng là xoá mô tả. `archived: true` đặt `archivedAt`, `false` mở lại lớp. Body rỗng trả 400.
- `POST /classes/:id/join-code` trả 200 với mã mới, mã cũ hết hiệu lực ngay, thành viên đã có vẫn ở trong lớp.
- `POST /classes/join` nhận `{ joinCode }`, bỏ khoảng trắng và không phân biệt hoa thường, trả 200 `{ data: { id, name, description, teacherName, joinedAt } }`. Tham gia lại trả cùng kết quả, không tạo bản ghi trùng. Mã sai định dạng trả 400; mã không có, đã đổi hoặc lớp đã lưu trữ trả 404 `CLASS_NOT_FOUND`; giáo viên của lớp trả 422 `CLASS_TEACHER_CANNOT_JOIN`.
- `GET /classes/joined` nhận `page`, `limit`, trả lớp đã tham gia chưa lưu trữ, mới tham gia trước.
- `POST /classes/:id/assignments` nhận `{ setId, modes, dueAt?, shareToClass? }` (việc 5.11): `modes` là 1 đến tất cả chế độ học, không trùng, theo thứ tự phải làm (việc 5.27 bỏ giới hạn 5) (vẫn nhận `mode` một chế độ như cũ); Ghép cặp cần bộ có ít nhất 2 thẻ, không thì 422 `VALIDATION_ERROR` ở `modes`. `dueAt` là ISO 8601 có múi giờ (lưu UTC), bỏ trống hoặc `null` là không có hạn; trả 201 `{ data: { id, classId, setId, setTitle, mode, modes, dueAt, createdAt } }` (`mode` là chế độ đầu, giữ cho code cũ). Giáo viên chỉ giao bộ của mình (bộ của người khác hoặc đã xoá trả 404 `SET_NOT_FOUND`), ADMIN giao được mọi bộ. Bộ `PRIVATE` mà không có `shareToClass: true` trả 422 `SET_NOT_SHAREABLE`; có thì bộ chuyển sang `CLASS` trong cùng transaction với bài giao. `GET /classes/:id/assignments` nhận `page`, `limit`, xếp hạn gần nhất trước, bài không có hạn xếp cuối. Việc 5.32 thêm `status` (`open`: không hạn hoặc chưa tới hạn; `closed`: đã quá hạn; `all` mặc định), `q` (tìm trong tên bộ, không phân biệt hoa thường), `sort` (`due` mặc định như trên, `-createdAt` mới giao trước); mỗi bài có thêm `submittedCount` (học sinh hiện trong lớp đã nộp) và `memberCount`, phản hồi có `counts: { open, closed, all }` tính sau khi tìm. `DELETE /classes/:id/assignments/:assignmentId` trả 204, bài không thuộc lớp trả 404 `ASSIGNMENT_NOT_FOUND`.
- `GET /classes/assignments` nhận `page`, `limit`, trả bài giao của các lớp đã tham gia (lớp chưa lưu trữ, bộ chưa xoá) dạng `{ id, classId, className, setId, setTitle, mode, dueAt, createdAt, status, completedAt }`, xếp hạn gần nhất trước, không hạn xếp cuối. `completedAt` là lần học xong đầu tiên đúng bộ và chế độ tính từ lúc giao. `status` là `done` khi đã có `completedAt` (kể cả nộp trễ), `overdue` khi quá `dueAt` mà chưa làm, còn lại `pending`. Người chưa vào lớp nào nhận danh sách trống. Việc 5.12 thêm `modes`, `doneModes` (số chế độ đã xong một phiên gắn bài) và `progressStatus` theo bài nộp: `submitted`, `late` (nộp sau hạn), `missed` (quá hạn chưa nộp), `in_progress` (đã xong ít nhất một chế độ), `todo`; danh sách xếp `missed` trước, rồi bài chưa nộp theo hạn, bài đã nộp cuối, phân trang sau khi xếp (tối đa 500 bài một người). Việc 5.30 thêm tham số `group` (`todo`: chưa làm, đang làm, bỏ lỡ; `done`: đã nộp, nộp trễ; `all` mặc định), `classId`, `q` (tìm trong tên bộ, không phân biệt hoa thường), `sort` (`due` mặc định như trên, `-createdAt` mới giao trước) và trả thêm `counts: { todo, done, all }` tính sau khi lọc lớp và tìm. `GET /classes/joined` nhận `q` tìm theo tên lớp. `status` cũ giữ cho code cũ.
- Làm và nộp bài (việc 5.12): `POST /study/sessions` nhận thêm `assignmentId`; người gọi phải là thành viên lớp chưa lưu trữ (không thì 404 `ASSIGNMENT_NOT_FOUND`), bộ và chế độ phải thuộc bài (không thì 422 `VALIDATION_ERROR` ở `mode`). `GET /classes/assignments/:assignmentId` trả `{ id, classId, className, setId, setTitle, modes, dueAt, createdAt, progress, submission, canSubmit }`: `progress` theo thứ tự `modes`, mỗi mục `{ mode, done, score }` với `done` là đã xong một phiên gắn bài, `score` là phần trăm phiên tốt nhất (Flashcard luôn `null`); `submission` là `{ submittedAt, score, late }` hoặc `null`. `POST /classes/assignments/:assignmentId/submit` trả 201 bài nộp: điểm là trung bình các chế độ có chấm (làm tròn), `late` khi nộp sau `dueAt`; chưa xong mọi chế độ trả 422 `ASSIGNMENT_INCOMPLETE`, nộp lần hai trả 409 `ASSIGNMENT_ALREADY_SUBMITTED`. Người ngoài lớp trả 404.
- Kết quả lớp chỉ tính học sinh hiện còn trong lớp và phiên học xong đúng bộ, đúng chế độ, sau lúc giao. `status` và `completedAt` như `GET /classes/assignments` (lần học xong đầu tiên); `correct`, `total` lấy lần có tỉ lệ đúng cao nhất, `null` khi chưa làm. `.../summary` trả `{ memberCount, doneCount, overdueCount, averageScore, hardCards }`: `averageScore` là phần trăm trung bình của học sinh đã làm, làm tròn một chữ số thập phân, `null` khi chưa ai làm; `hardCards` tối đa 5 thẻ sai nhiều nhất `{ cardId, term, definition, wrongCount, attemptCount }`. `.../results` nhận `page`, `limit`, `status?` (một trong `todo`, `in_progress`, `submitted`, `late`, `missed`), trả `{ userId, displayName, status, completedAt, correct, total, progressStatus, submission, modeScores }` theo thứ tự vào lớp; việc 5.17 thêm `progressStatus` theo bài nộp, `submission` (`{ submittedAt, score, late }` hoặc `null`) và `modeScores` (`{ mode, done, score }` theo thứ tự chế độ, chỉ phiên gắn bài), lọc theo `status` trước khi cắt trang. `.../summary` có thêm `submittedCount`, `lateCount`, `missedCount` theo bài nộp. `GET /classes/:id/members/:userId/results` nhận `page`, `limit`, trả bài giao của lớp kèm kết quả của học sinh đó, học sinh không ở trong lớp trả 404 `CLASS_MEMBER_NOT_FOUND`. Bài giao không thuộc lớp hoặc bộ đã xoá trả 404 `ASSIGNMENT_NOT_FOUND`.
- `GET /teacher/overview` (việc 5.19) tính trên các lớp chưa lưu trữ của người gọi, trả `{ data: { classCount, studentCount, newStudents, openAssignmentCount, dueSoonCount, onTimeRate, attention: { lowSubmissions, missedStreaks }, upcoming, recentSubmissions } }`. `newStudents` là học sinh vào lớp trong 7 ngày; `dueSoonCount` là bài chưa hết hạn, hạn trong 48 giờ; `onTimeRate` là phần trăm nộp đúng hạn của bài hết hạn trong 30 ngày, `null` khi chưa có. Học sinh chỉ phải làm bài có hạn sau ngày vào lớp. `lowSubmissions` là bài hạn trong 48 giờ mà dưới một nửa đã nộp (tối đa 5); `missedStreaks` là học sinh bỏ lỡ từ 2 bài liên tiếp gần nhất trong 30 ngày (tối đa 5); `upcoming` là tối đa 5 bài chưa hết hạn, hạn gần nhất trước, mỗi bài `{ assignmentId, classId, className, setTitle, dueAt, submitted, memberCount }`; `recentSubmissions` là 10 bài nộp mới nhất `{ userId, displayName, classId, className, assignmentId, setTitle, score, late, submittedAt }`.
- `GET /classes/:id/members/:userId` trả `{ data: { userId, displayName, joinedAt, stats } }`, không trả email; học sinh không ở trong lớp hoặc tài khoản đã xoá trả 404 `CLASS_MEMBER_NOT_FOUND`.
- `GET /classes/:id/members` nhận `page`, `limit`, `sort` (`joinedAt` mặc định, `-joinedAt`, `name`, `-name`), `q` (tìm trong tên, không phân biệt hoa thường, tối đa 100 ký tự), trả `{ data: [{ userId, displayName, joinedAt, stats }], meta }`, không trả email. `stats` (việc 5.15) là `{ onTime, late, missed, pending, averageScore, lastActiveAt }`: bài đã nộp tính đúng hạn hoặc trễ; chưa nộp mà quá hạn là bỏ lỡ, còn lại là đang chờ; bài hết hạn trước khi học sinh vào lớp không tính trừ khi em vẫn nộp; `averageScore` là trung bình điểm các bài nộp có điểm, một chữ số thập phân, `null` khi chưa có; `lastActiveAt` là lần gần nhất bắt đầu một phiên gắn bài của lớp. `DELETE /classes/:id/members/me` (rời lớp) và `DELETE /classes/:id/members/:userId` trả 204, người không ở trong lớp trả 404 `CLASS_MEMBER_NOT_FOUND`.
- Chỉ chủ thư mục được sửa và xoá, kể cả ADMIN cũng không. Thư mục không tồn tại trả 404 `FOLDER_NOT_FOUND`.

## Nhập từ

- `POST /import/preview` cần đăng nhập, nhận `{ content, options? }`. `content` là text đã dán hoặc nội dung file `.txt`, `.csv` mà web đã đọc, tối đa 2.000.000 ký tự, body tối đa 5 MB. `options` gồm `delimiter` (`auto`, `tab`, `comma`, `semicolon`, `dash` là `-`), `hasHeader`, `termColumn`, `definitionColumn` (đếm từ 1, mặc định 1 và 2). Endpoint chỉ phân tích, không lưu, trả 200 `{ data: { delimiter, columnCount, rows: [{ line, term, definition, errors }] } }`. `line` là số dòng gốc, dòng trống bị bỏ qua. Quá 2.000 dòng trả 422 `IMPORT_TOO_MANY_ROWS` kèm `details: { max, rows }`.
- `POST /sets/:id/import` dành cho chủ hoặc ADMIN, nhận `{ cards }` gồm 1 đến 2.000 thẻ đã xem trước, body tối đa 5 MB. Thẻ được thêm vào cuối bộ từ trong một transaction, trả 201 `{ data: { ...bộ từ, imported } }`. Tổng số thẻ sau khi nhập vượt 2.000 trả 422 `SET_CARD_LIMIT` kèm `details: { max, current, adding }` và không lưu gì. Nhập vào bộ mới dùng `POST /sets` kèm `cards`.
- Logic đọc nằm ở `parseImport` trong `@vocab/shared`: bỏ BOM, đọc ô CSV có ngoặc kép, công thức trong text và CSV giữ nguyên dạng văn bản.
- `options` nhận thêm `phoneticColumn` và `exampleColumn` (đếm từ 1, không bắt buộc, chuỗi rỗng coi như không chọn). Mọi cột được chọn phải khác nhau, nếu không trả 400 `VALIDATION_ERROR`. Khi chọn cột, mỗi phần tử trong `rows` có thêm `phonetic` hoặc `example`, ô trống là chuỗi rỗng và không phải lỗi. Không chọn thì dòng không có hai trường này. Giới hạn độ dài theo `cardInputSchema`.
- File `.xlsx` không gửi lên API: web đọc bằng `read-excel-file`, chuyển sheet đầu tiên thành text ngăn bằng tab rồi gửi `content`, form tự chọn `delimiter: 'tab'` (ADR 0002).

## Phiên học

- `POST /study/sessions` nhận `{ setId, mode, limit?, dueOnly?, cardIds? }`, trong đó `cardIds` giới hạn phiên ở các thẻ được chọn của bộ từ, trả 201 `{ data: { session, questions, languages } }`, trong đó `languages` là `{ term, definition }` để phát âm. Chỉ học được bộ từ người gọi xem được, nếu không trả 404 `SET_NOT_FOUND`. Chế độ chưa có trả 422 `STUDY_MODE_UNAVAILABLE`, bộ từ không có thẻ trả 422 `SET_HAS_NO_CARDS`. `dueOnly` chỉ lấy thẻ đã đến hạn của người gọi, không còn thẻ thì trả 422 `NO_CARDS_DUE`. Hiện có `FLASHCARD` với đáp án `known` hoặc `unknown`, cùng `WRITE` và `DICTATION` với đáp án là từ người học gõ, `MCQ` với đáp án là một phần tử trong `choices`, `CLOZE` với `prompt` là câu ví dụ có chỗ trống `_____`, `hint` là nghĩa và đáp án là từ người học gõ. `CLOZE` chỉ dùng thẻ có câu ví dụ chứa nguyên từ (không phân biệt hoa thường). `LEARN` trộn hai dạng câu theo mức nhớ của người gọi: thẻ chưa thuộc (chưa học hoặc lần gần nhất sai) có câu trắc nghiệm `<cardId>:choice` với `choices` ở phần đầu phiên, mọi thẻ có câu gõ từ `<cardId>:write` ở phần sau, `session.total` là số câu. `TEST` có mỗi thẻ một câu, dạng trắc nghiệm `<cardId>:choice` hoặc gõ từ `<cardId>:write` cố định theo id thẻ; web nộp cả phần 20 câu một lần, câu bỏ trống gửi chuỗi rỗng. `SPEAK` có `prompt` là từ, `hint` là nghĩa, đáp án là câu trình duyệt nhận dạng được, bỏ qua gửi chuỗi rỗng. `MATCH` với `prompt` là từ, đáp án là nghĩa người học ghép vào lần đầu. Web chia câu thành vòng 6 cặp và gửi đáp án của cả vòng theo thứ tự câu. Chế độ không tạo được câu hỏi nào từ các thẻ trả 422 `NO_QUESTIONS_FOR_MODE`. Câu hỏi của `FLASHCARD` và `WRITE` có thêm `imageUrl` khi thẻ có ảnh (việc 2.5c); các chế độ chọn hoặc ghép đáp án không có ảnh để không lộ đáp án.
- `POST /study/sessions/:id/answers` nhận `{ answers: [{ questionId, value, timeMs }] }`, tối đa 200 đáp án mỗi lô. Đáp án gửi lại y hệt trong cùng phiên không được tính lần hai. Endpoint trả 200 `{ data: { results, ignored } }`. Server chấm lại, lưu `Attempt` và cập nhật `CardProgress` trong một transaction. Câu hỏi của thẻ đã xoá được bỏ qua và tính vào `ignored`. Phiên đã kết thúc trả 409 `STUDY_SESSION_FINISHED`. Client gửi các lô lần lượt, không gửi song song.
- `PATCH /study/sessions/:id/finish` trả 200 `{ data: { session, wrongCardIds } }`. `total` là số thẻ đã trả lời, `correct` và `wrongCardIds` tính theo lần trả lời đầu của mỗi thẻ. Gọi lại không đổi kết quả.
- Hai route theo `:id` chỉ dành cho chủ phiên, kể cả ADMIN cũng không gọi thay được.

- `GET /review/due` nhận `page`, `limit`, trả các bộ từ có thẻ đến hạn tại thời điểm gọi: `{ data: [{ setId, title, dueCount }], meta, summary: { dueCards, nextDueAt } }`, `nextDueAt` là lần đến hạn sớm nhất sau thời điểm gọi hoặc `null`, xếp theo tên. Chỉ tính bộ từ người gọi còn xem được.

## Quản trị người dùng

- `GET /admin/users` nhận `page`, `limit`, `sort` (`createdAt`, `email`, `displayName`, mặc định `-createdAt`) `q` (tìm trong email hoặc tên, không phân biệt hoa thường, tối đa 100 ký tự), `role` (`STUDENT`, `TEACHER`, `ADMIN`) và `status` (`active` là chưa khoá, `locked` là đang khoá; việc 5.35), trả `{ data: [{ id, email, displayName, role, createdAt, lockedAt, lockReason, lockedById }], meta }`. Không trả hash mật khẩu.
- `PATCH /admin/users/:id/role` nhận `{ role }` (`STUDENT`, `TEACHER`, `ADMIN`), trả người dùng sau khi đổi. ADMIN tự đổi vai trò của mình trả 422 `CANNOT_CHANGE_OWN_ROLE` để hệ thống luôn còn ADMIN; người không tồn tại trả 404 `USER_NOT_FOUND`. Quyền mới có hiệu lực ngay vì API đọc vai trò từ database ở mỗi request.
- `PATCH /admin/users/:id/lock` nhận `{ reason }` (1 đến 500 ký tự), lưu thời điểm, lý do và id ADMIN, tăng `tokenVersion` và xoá mọi phiên refresh nên tài khoản bị đăng xuất ngay, trả 200 `{ data: user }`. Tự khoá mình trả 422 `CANNOT_LOCK_SELF`. `PATCH /admin/users/:id/unlock` xoá ba trường khoá. Không tìm thấy trả 404 `USER_NOT_FOUND`.
- Tài khoản bị khoá đăng nhập bằng mật khẩu hoặc Google trả 403 `ACCOUNT_LOCKED`, chỉ sau khi mật khẩu đúng. Refresh trả 401 và access token cũ bị `AuthGuard` từ chối.

- `GET /uploads/config` trả `{ data: { images, maxBytes, contentTypes } }`; `images` là `false` khi thiếu một trong các biến `R2_*`, web ẩn nút thêm ảnh.
- `POST /uploads/presign` nhận `{ contentType, size }` (`image/png`, `image/jpeg`, `image/webp`, tối đa 1 MB), trả 200 `{ data: { uploadUrl, headers, publicUrl, expiresAt } }`. Trình duyệt `PUT` tệp lên `uploadUrl` kèm `headers` trong 5 phút; chữ ký gồm cả `content-type` và `content-length` nên tệp khác loại hoặc khác dung lượng bị R2 từ chối. Khoá tệp là `cards/<userId>/<uuid>.<đuôi>`. Thiếu khoá R2 trả 503 `UPLOADS_DISABLED`.
- Thẻ nhận `imageUrl` khi tạo bộ (`POST /sets`) và khi lưu thẻ (`PUT /sets/:id/cards`). Địa chỉ phải bắt đầu bằng `${R2_PUBLIC_URL}/cards/`, nếu không trả 400 `CARD_IMAGE_INVALID` kèm `details[].path`. Trong `PUT /sets/:id/cards`, thiếu `imageUrl` thì giữ ảnh cũ, `null` thì gỡ ảnh. Nhập thẻ từ file không nhận ảnh.
- `GET /admin/stats` trả `{ users, lockedUsers, sets, hiddenSets }` (không tính tài khoản và bộ đã xoá); việc 5.21 thêm `newUsers` (đăng ký 7 ngày), `activeUsers` (người có phiên học trong 7 ngày), `sessions` (phiên học 7 ngày), `publicSets`, `roles` `{ STUDENT, TEACHER, ADMIN }`, `daily` (30 ngày học theo giờ Việt Nam, cũ nhất trước, mỗi ngày `{ day, signups, active }`), `recentUsers` (5 tài khoản mới nhất `{ id, displayName, email, role, createdAt }`) và `newPublicSets` (tối đa 5 bộ công khai chưa ẩn tạo trong 7 ngày `{ id, title, ownerName, cardCount, createdAt }`).
- `PATCH /admin/sets/:id/hide` nhận `{ reason }` (1 đến 500 ký tự), lưu thời điểm, lý do và id ADMIN, trả 200 `{ data: { id, title, hiddenAt, hiddenReason, hiddenById } }`. `PATCH /admin/sets/:id/unhide` xoá ba trường này. Bộ không tồn tại hoặc đã xoá trả 404 `SET_NOT_FOUND`. `GET /sets/:id` trả thêm `hiddenAt`, `hiddenReason` để chủ bộ và ADMIN thấy trạng thái ẩn. Bộ bị ẩn không còn trong `GET /sets/public`, và với người không phải chủ hay ADMIN thì `GET /sets/:id`, học, sao chép đều trả 404.

## Thống kê

- `GET /stats/sets/:id` trả `{ data: { total, mastered, learning, notStarted, due } }`, trả 404 nếu không xem được bộ từ.
- `GET /stats/sets/:id/cards` trả `{ data: [{ cardId, level, dueAt }] }` theo thứ tự thẻ cho người gọi: `level` là `new` (chưa học), `learning` hoặc `mastered` (khoảng ôn từ `MASTERED_INTERVAL_DAYS` ngày), `dueAt` là lần ôn tiếp theo hoặc `null`. Không xem được bộ từ trả 404.
- `GET /stats/overview` trả `{ data: { streakDays, masteredCards, learningCards, activity, answersToday, dueCards, hardCards } }`. `learningCards` là thẻ đã học nhưng chưa thuộc, `activity` là 7 phần tử `{ day, answers }` theo ngày học, ngày cũ nhất trước. Ngày học tính theo giờ Việt Nam (UTC+7). Chuỗi ngày vẫn giữ nếu hôm nay chưa học nhưng hôm qua có học. Thẻ đã thuộc là thẻ có `interval` từ 6 ngày. `hardCards` gồm tối đa 5 thẻ sai nhiều nhất, thuộc bộ từ người gọi còn xem được.

## Khác biệt đang có trong code

- `GET /health` trả trực tiếp `{ "status": "ok", "db": "up" }`, không bọc `data`. Đây là ngoại lệ có chủ đích và `healthResponseSchema` đang kiểm tra đúng dạng này.
- Khi database lỗi, `/health` trả 503 với mã `DB_UNAVAILABLE`.
- Chưa có interceptor bọc response. Endpoint nghiệp vụ tự trả `{ data }` hoặc `{ data, meta }` qua helper `ok()` và `paginated()` trong `common/base/pagination.ts` (mẫu trong skill `api-endpoint`).
- `details` là `null` khi lỗi không có chi tiết. `requestId` là UUID, đồng thời nằm trong header `x-request-id`.
- `lib/http.ts` trả nguyên body, nên `features/*/api.ts` tự lấy `.data`. Nó tự gắn access token, gặp 401 thì refresh một lần rồi gửi lại request. Route của phiên đăng nhập dùng `skipAuth`.
- `GET /sets/public` phải khai báo trước `GET /sets/:id`. `GET /sets/:id` dùng `@OptionalAuth()`: không có token là khách, token sai trả 401.

## Đã điều chỉnh so với spec gốc

- Đường dẫn mã lỗi đổi thành `packages/shared/src/errors.ts`.
- Bổ sung mã 503 và mục khác biệt ở trên.
- Ví dụ lỗi dùng `requestId` dạng UUID.
