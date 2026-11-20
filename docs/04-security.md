# Bảo mật và phân quyền

Nguồn: tách từ `spec-source.md`, đã đối chiếu với code.

**Hiện trạng:** đã có `AuthGuard` toàn cục (từ chối mọi route không có `@Public()`), helmet, CORS theo `CORS_ORIGINS`, kiểm tra env bằng Zod khi khởi động. Đăng ký và đăng nhập đã có argon2id và rate limit. Đăng nhập Google xác thực ID token ở API. Email đã xác minh trùng tài khoản mật khẩu thì được gộp, mật khẩu cũ và mọi phiên cũ bị huỷ, vì đăng ký bằng mật khẩu chưa xác minh email nên người đặt mật khẩu có thể không phải chủ email. Đăng nhập cấp access token và cookie refresh, refresh token được xoay vòng và phát hiện dùng lại, `AuthGuard` xác thực JWT và đối chiếu `tokenVersion` trong database ở mỗi request. `@CurrentUser()`, `RolesGuard`, `OwnershipGuard` đã có. Web giữ access token trong bộ nhớ. `proxy.ts` không đọc được cookie refresh ở domain API, nên dùng cookie `vocab_session` chỉ để điều hướng, không có giá trị bảo mật. Web đặt CSP và header bảo mật trong `next.config.ts`. API có giới hạn chung theo người dùng và theo IP cho khách. Secret JWT đang yêu cầu tối thiểu 32 ký tự. Quên mật khẩu (việc 1.49a) luôn trả cùng một thông báo để không lộ email nào có tài khoản, token là 32 byte ngẫu nhiên, chỉ lưu SHA-256, sống 30 phút, dùng một lần; đặt lại mật khẩu tăng `tokenVersion` và xoá mọi refresh session. Email gửi qua Brevo, chưa có khoá thì API không gửi thư và không ghi nội dung thư vào log.

Access token sống 15 phút, chỉ nằm trong bộ nhớ trình duyệt; refresh token sống 30 ngày trong cookie httpOnly và được xoay vòng sau mỗi lần dùng.

## JWT: thiết kế token

|              | Access token                                              | Refresh token                                                                                                                                       |
| ------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thời hạn     | 15 phút                                                   | 30 ngày                                                                                                                                             |
| Nơi lưu (FE) | Biến trong bộ nhớ (Zustand), không lưu localStorage       | Cookie `httpOnly`, `Path=/api/v1/auth`, `SameSite` theo `REFRESH_COOKIE_SAME_SITE` (mặc định `lax`), `Secure` ở production hoặc khi `SameSite=none` |
| Gửi đi       | Header `Authorization: Bearer <token>`                    | Trình duyệt tự gửi khi gọi `/auth/refresh`                                                                                                          |
| Nội dung     | `sub` (userId), `role`, `tv` (tokenVersion), `iat`, `exp` | `sub`, `sid` (id phiên), `fam` (familyId)                                                                                                           |
| Ký           | `JWT_ACCESS_SECRET` (HS256, ≥ 32 byte ngẫu nhiên)         | `JWT_REFRESH_SECRET` khác hoàn toàn                                                                                                                 |
| Lưu DB       | Không                                                     | Chỉ lưu hash SHA-256 trong `RefreshSession`                                                                                                         |

**Vì FE (Vercel) và BE (Render) khác domain**, cookie là cookie bên thứ ba và có thể bị Safari chặn. Cách xử lý, chọn một:

1. **Khuyến nghị:** dùng domain riêng, FE ở `app.tenmien.vn`, BE ở `api.tenmien.vn`; cookie đặt `Domain=.tenmien.vn`, `SameSite=Lax`.
2. Chưa có domain: cấu hình `rewrites` trong `next.config` để `/api/*` của Vercel chuyển tiếp sang backend, trình duyệt chỉ thấy một domain.

## Luồng refresh và phát hiện đánh cắp token

1. Access token hết hạn → API trả 401 `TOKEN_EXPIRED`.
2. `lib/http.ts` gọi `/auth/refresh` **một lần duy nhất** (các request khác chờ chung một Promise), rồi gửi lại request cũ.
3. Server tìm `RefreshSession` theo hash: còn hạn và chưa thu hồi → thu hồi bản cũ, tạo bản mới cùng `familyId`, trả cặp token mới.
4. Token đã thu hồi được gửi lại trong 10 giây → thường là tab khác đang refresh: trả 409 `REFRESH_IN_PROGRESS`. Client thử lại tối đa 5 lần cách nhau 300 ms (khoảng 1,5 giây). Vẫn 409 nghĩa là refresh trước bị huỷ giữa chừng (chuyển trang, tải lại đúng lúc) nên trình duyệt giữ token đã thu hồi: client xoá phiên và đưa về trang đăng nhập, không báo lỗi mạng. Server không cấp lại token cho token đã thu hồi để kẻ cầm token cũ không lấy được phiên (quyết định ở issue #239).
5. Token đã thu hồi được dùng lại sau 10 giây → có người đã lấy cắp: xoá cả family, bắt đăng nhập lại.
6. Refresh thất bại → xoá state, chuyển về `/login?next=<trang cũ>`.

## Phân quyền: RBAC + quyền sở hữu

Hai lớp kiểm tra, đều là guard dùng chung, không viết lại trong service:

- **Vai trò (RBAC):** `@Roles('TEACHER', 'ADMIN')` + `RolesGuard` — ai được gọi loại endpoint này.
- **Sở hữu (resource-based):** `@CheckOwnership('set')` + `OwnershipGuard` — bộ từ này có phải của bạn không. ADMIN được bỏ qua với bộ từ, không được bỏ qua với phiên học (`@CheckOwnership('session')`). Tham số đường dẫn mặc định là `id`, đổi bằng đối số thứ hai. Không phải chủ trả 403, không tồn tại hoặc đã xoá mềm trả 404.

| Hành động           | Khách | STUDENT       | TEACHER                 | ADMIN |
| ------------------- | ----- | ------------- | ----------------------- | ----- |
| Xem bộ từ PUBLIC    | Có    | Có            | Có                      | Có    |
| Xem bộ từ PRIVATE   | Không | Chỉ của mình  | Chỉ của mình            | Có    |
| Xem bộ từ CLASS     | Không | Lớp được giao | Của mình, lớp được giao | Có    |
| Tạo / import bộ từ  | Không | Có            | Có                      | Có    |
| Sửa / xoá bộ từ     | Không | Chỉ của mình  | Chỉ của mình            | Có    |
| Lưu tiến độ học     | Không | Có            | Có                      | Có    |
| Tạo lớp, giao bài   | Không | Không         | Có                      | Có    |
| Xem kết quả của lớp | Không | Không         | Lớp của mình            | Có    |
| Quản lý người dùng  | Không | Không         | Không                   | Có    |

ADMIN khoá tài khoản qua `/admin/users/:id/lock`: tăng `tokenVersion`, xoá mọi phiên refresh, đăng nhập trả 403 `ACCOUNT_LOCKED` chỉ khi mật khẩu đúng để không lộ trạng thái khoá cho người đoán mật khẩu. ADMIN không tự khoá được mình. ADMIN ẩn bộ vi phạm qua `/admin/sets/:id/hide`: `visibleTo()` loại bộ có `hiddenAt` khỏi phần công khai, chủ bộ và ADMIN vẫn xem được. Bộ `CLASS` mở cho giáo viên và thành viên của lớp chưa lưu trữ đã được giao bộ đó (việc 3.4); rời lớp hoặc lớp bị lưu trữ thì mất quyền ngay vì điều kiện nằm trong truy vấn.

Mặc định **mọi route đều cần đăng nhập**: `AuthGuard` đặt global, route công khai phải ghi rõ `@Public()`. Quên gắn decorator thì route bị khoá, không bị lộ.

```ts
@Controller('sets')
export class SetsController {
  constructor(private readonly sets: SetsService) {}

  @Public()
  @Get('public')
  findPublic(@Query(new ZodValidationPipe(paginationSchema)) q: Pagination) {
    return this.sets.findPublic(q);
  }

  @Patch(':id')
  @CheckOwnership('set')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateSetSchema)) dto: UpdateSetDto) {
    return this.sets.update(id, dto);
  }
}
```

Frontend cũng ẩn nút theo quyền (`<Can action="update" resource={set}>`), nhưng **backend luôn là nơi quyết định**; ẩn nút chỉ để giao diện gọn.

## Checklist bảo mật

- [x] Mật khẩu hash bằng **argon2id** (hoặc bcrypt cost 12); tối thiểu 8 ký tự.
- [x] Rate limit: `/auth/login` 5 lần/phút/IP+email và 20 lần/phút/IP, `/auth/register` 3 lần/phút/IP và `/auth/refresh` 60 lần/phút/IP (chỉnh bằng `RATE_LIMIT_REGISTER_PER_MINUTE`, `RATE_LIMIT_REFRESH_PER_MINUTE`), API chung 100 lần/phút/người dùng và 300 lần/phút/IP cho khách (chỉnh bằng `RATE_LIMIT_USER_PER_MINUTE`, `RATE_LIMIT_GUEST_PER_MINUTE`). `/auth/*` và `/health` không tính vào giới hạn chung. Bộ đếm nằm trong bộ nhớ nên chỉ đúng khi chạy một instance, việc 2.1 chuyển sang Redis. Sau proxy phải đặt `TRUSTED_PROXIES`.
- [x] Thông báo đăng nhập sai chung chung ("Email hoặc mật khẩu không đúng"), không tiết lộ email đã tồn tại. Đăng ký bằng email đã có trả cùng kết quả với email mới.
- [x] Validate mọi input bằng Zod; giới hạn độ dài (term ≤ 200, definition ≤ 1.000 ký tự, ≤ 2.000 thẻ/bộ).
- [x] Chống IDOR: không truy vấn chỉ bằng `id`; luôn kèm `ownerId` hoặc qua `OwnershipGuard`.
- [x] Chống mass assignment: DTO chỉ cho phép trường được liệt kê; không bao giờ nhận `role`, `ownerId` từ client.
- [ ] Import file: giới hạn 2 MB, chỉ nhận `.csv .xlsx .txt`, kiểm tra MIME, không chạy công thức Excel; chặn CSV injection khi export (ký tự đầu `= + - @`). Đã có giới hạn 2.000.000 ký tự, 2.000 dòng và tổng 2.000 thẻ trên API, công thức được lưu như văn bản. Web nhận `.txt`, `.csv`, `.xlsx` tối đa 2 MB và kiểm tra MIME. File văn bản có byte NUL bị từ chối. File `.xlsx` được đọc trên trình duyệt bằng `read-excel-file`, chặn file trên 2 MB trước khi giải nén, chỉ đọc sheet đầu tiên, chỉ lấy giá trị đã tính sẵn, không chạy công thức (ADR 0002). File `.xls` cũ bị từ chối.
- [ ] Upload ảnh qua presigned URL có hạn 5 phút, giới hạn 1 MB, chỉ `image/png|jpeg|webp`. Chưa có tính năng upload.
- [x] XSS: React tự escape; cấm `dangerouslySetInnerHTML` với nội dung người dùng; đặt Content-Security-Policy. Chỗ dùng duy nhất là script giao diện có nội dung cố định.
- [x] Header bảo mật bằng `helmet` (BE) và `headers()` trong `next.config` (FE).
- [x] CORS chỉ cho phép domain FE trong `CORS_ORIGINS`, `credentials: true`.
- [x] CSRF: refresh cookie chỉ dùng ở `/auth/*`, kiểm tra header `Origin`; các API khác dùng Bearer nên không bị CSRF.
- [ ] Secret chỉ nằm trong biến môi trường của Render/Vercel; `.env` trong `.gitignore`; config validate bằng Zod lúc khởi động, thiếu là không chạy. Phần trong repo đã đạt, phần Render và Vercel kiểm tra khi triển khai.
- [x] Log không ghi mật khẩu, token, cookie: `redact` của Pino trong `apps/api/src/config/logger.ts`, query string bị bỏ khỏi URL trong log.
- [x] `npm audit` và Dependabot bật trong CI.
- [x] Dữ liệu học sinh: chỉ thu email và tên hiển thị; có nút xoá tài khoản xoá hẳn dữ liệu.

## Header bảo mật của web

`apps/web/src/lib/security-headers.ts` tạo header cho mọi route. CSP chỉ cho gọi origin của `NEXT_PUBLIC_API_URL` và Google Identity. Giá trị này được đọc lúc build, đổi API thì phải build lại.

`script-src` có `'unsafe-inline'` vì app dùng prerender một phần, phần tĩnh không nhận được nonce theo request. CSP vì vậy không chặn được script nội tuyến nếu có lỗi XSS, nên React escape và lệnh cấm `dangerouslySetInnerHTML` vẫn là lớp bảo vệ chính. Môi trường dev có thêm `'unsafe-eval'` và `ws:`.

`Permissions-Policy` cho `microphone=(self)` để chế độ Luyện nói dùng micro của chính trang; camera và vị trí vẫn bị chặn. Chrome gửi âm thanh nhận dạng tới dịch vụ của Google, app không lưu âm thanh, chỉ gửi câu nhận dạng được lên API.

Service worker `public/sw.js` chỉ lưu tạm tài nguyên tĩnh có mã băm (`/_next/static`, icon) và trang `/offline`, không lưu request `/api/` hay trang có dữ liệu người dùng, nên đăng xuất không để lại dữ liệu riêng trong bộ nhớ tạm. Bộ từ người dùng tải về máy cùng hàng đợi phiên học offline nằm trong IndexedDB `vocab-offline` và bị xoá khi đăng xuất, kể cả phiên chưa kịp gửi lên máy chủ.

`worker-src 'self' blob:` cho phép `read-excel-file` đọc file Excel trong worker tạo từ `blob:` (ADR 0002).

## Đã điều chỉnh so với spec gốc

- `JwtAuthGuard` đổi thành `AuthGuard`, đúng tên trong `common/guards/auth.guard.ts`. Guard này đã xác thực JWT.
- Thêm mục hiện trạng. Các ô trong checklist vẫn để trống để kiểm tra theo từng tính năng.
- "Xoá tài khoản xoá hẳn dữ liệu" được hỗ trợ ở database bằng `onDelete: Cascade`, xem `02-database.md`.
