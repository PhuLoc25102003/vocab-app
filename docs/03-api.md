# API

Nguồn: tách từ `spec-source.md`, đã đối chiếu với code. REST, tiền tố `/api/v1`, cổng local 4000.

**Đã có:** `GET /health`, `POST /auth/register`. Các endpoint còn lại là hợp đồng cần làm theo.

## Danh sách endpoint

| Method | Path                        | Quyền              | Mô tả                                                      |
| ------ | --------------------------- | ------------------ | ---------------------------------------------------------- |
| POST   | /auth/register              | Công khai          | Đăng ký email + mật khẩu, trả 202                          |
| POST   | /auth/login                 | Công khai          | Trả access token, đặt cookie refresh                       |
| POST   | /auth/google                | Công khai          | Đăng nhập bằng Google ID token                             |
| POST   | /auth/refresh               | Cookie refresh     | Cấp cặp token mới (rotation)                               |
| POST   | /auth/logout                | Đã đăng nhập       | Thu hồi refresh session hiện tại                           |
| POST   | /auth/logout-all            | Đã đăng nhập       | Tăng `tokenVersion`, đăng xuất mọi thiết bị                |
| GET    | /users/me                   | Đã đăng nhập       | Thông tin tài khoản                                        |
| PATCH  | /users/me                   | Đã đăng nhập       | Sửa tên, mật khẩu                                          |
| GET    | /sets                       | Đã đăng nhập       | Bộ từ của tôi, phân trang                                  |
| GET    | /sets/public                | Công khai          | Tìm bộ từ công khai                                        |
| POST   | /sets                       | STUDENT+           | Tạo bộ từ kèm danh sách thẻ                                |
| GET    | /sets/:id                   | Chủ hoặc bộ PUBLIC | Chi tiết + thẻ                                             |
| PATCH  | /sets/:id                   | Chủ                | Sửa thông tin                                              |
| DELETE | /sets/:id                   | Chủ, ADMIN         | Xoá mềm                                                    |
| POST   | /sets/:id/duplicate         | Đã đăng nhập       | Sao chép bộ công khai về tài khoản                         |
| PUT    | /sets/:id/cards             | Chủ                | Lưu toàn bộ thẻ (thêm, sửa, xoá, đổi thứ tự)               |
| POST   | /import/preview             | Đã đăng nhập       | Phân tích text/CSV/XLSX, trả danh sách thẻ + lỗi từng dòng |
| POST   | /sets/:id/import            | Chủ                | Lưu kết quả đã xem trước                                   |
| POST   | /uploads/presign            | Đã đăng nhập       | URL ký sẵn để tải ảnh lên R2                               |
| POST   | /study/sessions             | Đã đăng nhập       | Bắt đầu phiên, trả câu hỏi theo mode                       |
| POST   | /study/sessions/:id/answers | Chủ phiên          | Gửi đáp án theo lô, cập nhật SRS                           |
| PATCH  | /study/sessions/:id/finish  | Chủ phiên          | Kết thúc, trả kết quả                                      |
| GET    | /review/due                 | Đã đăng nhập       | Thẻ đến hạn ôn hôm nay                                     |
| GET    | /stats/overview             | Đã đăng nhập       | Streak, số từ đã thuộc, từ hay sai                         |
| GET    | /health                     | Công khai          | Kiểm tra API + kết nối DB                                  |
| GET    | /admin/users                | ADMIN              | Quản lý người dùng                                         |

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
- Phân trang: `?page=1&limit=20&sort=-updatedAt`, `limit` tối đa 100.
- Tài liệu API sinh tự động bằng `@nestjs/swagger` tại `/api/docs`, bản JSON tại `/api/docs-json`. Hai đường dẫn này nằm ngoài `/api/v1` và tắt khi `NODE_ENV=production`.
- Khi cần đổi hợp đồng API, tạo `/api/v2`, không sửa ngầm `/v1`.

## Đăng ký

- `POST /auth/register` nhận `{ email, password, displayName }`, luôn trả 202 `{ "data": { "status": "accepted" } }` khi dữ liệu hợp lệ, kể cả khi email đã có. Tài khoản cũ không bị đổi. Giao diện chuyển người dùng sang trang đăng nhập.
- Vượt giới hạn trả 429 `TOO_MANY_REQUESTS` kèm header `Retry-After` (giây).

## Khác biệt đang có trong code

- `GET /health` trả trực tiếp `{ "status": "ok", "db": "up" }`, không bọc `data`. Đây là ngoại lệ có chủ đích và `healthResponseSchema` đang kiểm tra đúng dạng này.
- Khi database lỗi, `/health` trả 503 với mã `DB_UNAVAILABLE`.
- Chưa có interceptor bọc response. Endpoint nghiệp vụ tự trả `{ data }` hoặc `{ data, meta }` qua helper `ok()` và `paginated()` trong `common/base/pagination.ts` (mẫu trong skill `api-endpoint`).
- `details` là `null` khi lỗi không có chi tiết. `requestId` là UUID, đồng thời nằm trong header `x-request-id`.
- `lib/http.ts` trả nguyên body, nên `features/*/api.ts` tự lấy `.data`.
- `GET /sets/public` phải khai báo trước `GET /sets/:id`. `GET /sets/:id` cho khách xem bộ PUBLIC nên cần `@Public()` kèm xác thực tuỳ chọn.

## Đã điều chỉnh so với spec gốc

- Đường dẫn mã lỗi đổi thành `packages/shared/src/errors.ts`.
- Bổ sung mã 503 và mục khác biệt ở trên.
- Ví dụ lỗi dùng `requestId` dạng UUID.
