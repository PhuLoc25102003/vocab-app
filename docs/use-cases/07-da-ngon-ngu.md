# Use case: giao diện hai ngôn ngữ

Góp ý ngày 2026-11-21: cần đổi toàn bộ trang web giữa tiếng Việt và tiếng Anh. Thiết kế kỹ thuật ở `docs/adr/0003-da-ngon-ngu-bang-i18next.md`.

| Mã     | Vấn đề                                                                                                                                                                                         | Nguồn | Mức | Việc        |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | --- | ----------- |
| GAP-30 | Toàn bộ giao diện viết cứng tiếng Việt, không đổi được ngôn ngữ                                                                                                                                | Góp ý | Vừa | 6.1 đến 6.7 |
| GAP-36 | Nút đổi ngôn ngữ header auth nằm giữa; lỗi auth/Google không dịch theo locale hiện tại; cảnh báo Turbopack script trong LocaleRoot; thẻ stat ở Tổng quan 3 role mờ nhạt, rập khuôn template AI | Góp ý | Vừa | 6.8         |

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

## UC-I5. Tinh chỉnh UX xác thực và thiết kế thẻ thống kê đa vai trò

- **Việc:** 6.8 (GAP-36). **Người dùng:** mọi người dùng (khách, học sinh, giáo viên, admin).
- **Phải có:**
  - Header trang xác thực (`AuthLayout`): gom cụm `LanguageToggle` và `ThemeToggle` về góc phải cạnh nhau (`flex items-center gap-2`), tránh `LanguageToggle` bị đẩy ra giữa màn hình gây mất cân đối thị giác.
  - Thông báo lỗi form và xác thực (`formErrorMessage`, `errorCodeMessage`): tự động nhận diện locale chính xác (qua tham số truyền vào, i18next context, `document.documentElement.lang`, cookie). Khi người dùng đang ở giao diện tiếng Anh mà gặp lỗi máy chủ (ví dụ `ACCOUNT_LOCKED`), thông báo phải hiển thị bằng tiếng Anh ("This account is locked. Contact an administrator.") thay vì chuỗi tiếng Việt của máy chủ.
  - Nút Google Sign-in: truyền tham số `locale: locale === 'en' ? 'en' : 'vi'` động theo ngôn ngữ giao diện đang chọn, cập nhật khi đổi ngôn ngữ.
  - Loại bỏ thẻ `<script>` lồng trong React Server Component `LocaleRoot` ở `src/app/layout.tsx` để khắc phục cảnh báo Turbopack ("Scripts inside React components are never executed when rendering on the client"). Việc đồng bộ `document.documentElement.lang` từ cookie được chuyển vào `themeInitScript` ở `<head>` và `I18nProvider`.
  - Thẻ thống kê ở trang Tổng quan của 3 vai trò dùng chung một kiểu (mục "Thẻ thống kê" trong `docs/05-ui-tokens.md`): số `text-h2` ở trên, nhãn ở dưới, icon có màu theo nghĩa nhưng chỉ dùng token (`primary`, `success`, `highlight`, trung tính). Thứ tự DOM vẫn là `<dt>` rồi `<dd>`.
    - **Học sinh**: Chuỗi ngày (Flame), Từ đã thuộc (Award, kèm quy tắc tính), Đang học (BookOpen), Trả lời hôm nay (TrendingUp).
    - **Giáo viên**: Lớp học (GraduationCap), Học sinh (Users, chú thích số học sinh mới), Bài đang mở (ClipboardList, chú thích sắp đến hạn), Tỉ lệ đúng hạn (CheckCircle2).
    - **Admin**: Người dùng (Users, chú thích số mới trong 7 ngày), Hoạt động 30 ngày (Activity), Bộ từ (Library, chú thích số công khai), Phiên học (BookMarked).
  - Thẻ `<html>` có `translate="no"` và `<meta name="google" content="notranslate">`: trang đã có tiếng Anh, Google Dịch sửa DOM sẽ làm React lỗi khi cập nhật.
  - Lỗi trên form đăng nhập và nút Google lưu lỗi gốc, thông báo dịch lại khi người dùng đổi ngôn ngữ.
- **Kiểm tra:**
  - Unit test cho `formErrorMessage` dịch đúng theo locale được chỉ định hoặc DOM lang.
  - Unit test cho `GoogleSignIn` truyền `locale: 'en'` và dịch thông báo lỗi sang tiếng Anh khi ở ngôn ngữ tiếng Anh.
  - Unit test cho `StatsOverview`, `TeacherOverview`, `AdminOverview` giữ trọn vẹn ngữ nghĩa `<dl>`, `<dt>`, `<dd>` và toàn bộ chuỗi số liệu/nhãn.
