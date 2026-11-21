# ADR 0003: Giao diện hai ngôn ngữ Việt và Anh bằng i18next

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-11-21

## Bối cảnh

Giao diện web hiện viết cứng tiếng Việt trong khoảng 150 file `.tsx`, cộng với thông báo lỗi của API và thông báo của Zod schema trong `@vocab/shared`. Người dùng muốn đổi được toàn bộ trang sang tiếng Anh và đổi lại, chỉ hai ngôn ngữ: Việt (mặc định) và Anh. Người phụ trách chọn i18next.

## Quyết định

- Dùng **`i18next`** và **`react-i18next`** trong `apps/web`, ghim phiên bản. Không dùng plugin tải file qua mạng: hai bộ chuỗi `vi` và `en` là JSON trong `apps/web/src/locales/<ngôn ngữ>/<namespace>.json`, import tĩnh, chia namespace theo feature (`common`, `auth`, `sets`, `study`, `classes`, `account`, `admin`, `marketing`, `errors`).
- Ngôn ngữ lưu trong cookie `vocab.locale` (`vi` hoặc `en`, một năm, `SameSite=Lax`). Không có cookie thì dùng `vi`. Không thêm tiền tố `/en` vào URL để giữ nguyên toàn bộ route, link và test hiện có.
- Server component lấy chuỗi qua `getT(namespace)` trong `lib/i18n/server.ts`: đọc cookie, tạo instance i18next riêng cho mỗi request bằng `createInstance()`. Client component dùng `useTranslation(namespace)` dưới `I18nProvider` do root layout truyền ngôn ngữ xuống. Root layout đặt `<html lang>` theo ngôn ngữ.
- Đổi ngôn ngữ: ghi cookie, client đổi ngay bằng `i18n.changeLanguage`, rồi `router.refresh()` để server component render lại. Nút đổi ở header (cả trang giới thiệu) và trong Tài khoản.
- Khoá dịch có kiểu: khai báo `CustomTypeOptions` của i18next từ file `vi`, gõ sai khoá là lỗi TypeScript. Test kiểm tra hai ngôn ngữ có cùng bộ khoá.
- Lỗi API: web hiện thông báo theo `error.code` (namespace `errors`), chỉ dùng `message` của máy chủ khi không có khoá. API giữ thông báo tiếng Việt như hiện nay.
- Zod schema trong shared đổi `message` thành khoá dịch (ví dụ `validation.titleRequired`), web dịch khi hiện lỗi form; API trả khoá trong `details` như cũ.
- Ngày giờ và số dùng `Intl` với ngôn ngữ hiện tại (`vi-VN` hoặc `en-US`). Nội dung người dùng nhập (bộ từ, thẻ, tên lớp) không dịch.

## Lý do

- i18next phổ biến, có `useTranslation`, số nhiều, nội suy và kiểu cho khoá; dùng được ở cả server và client của Next App Router khi tạo instance theo request.
- Cookie thay cho tiền tố URL vì phần lớn trang cần đăng nhập, không cần SEO theo ngôn ngữ; đổi cấu trúc route sẽ đụng mọi link, middleware và E2E.
- Import tĩnh hai ngôn ngữ nhỏ (vài chục KB) đơn giản hơn tải lazy và chạy được offline (PWA).

## Hệ quả

- Thêm dependency `i18next`, `react-i18next` cho `@vocab/web`; theo dõi qua Dependabot.
- Root layout đọc cookie nên các trang giới thiệu tĩnh chuyển sang render động. Chấp nhận, đo lại Lighthouse ở việc 1.34.
- Mọi chuỗi giao diện mới phải đi qua `t()`. Việc 6.7 thêm script báo chữ tiếng Việt viết cứng trong `.tsx`, chạy cùng `npm run lint`.
- Test component render dưới `I18nProvider` với `vi`, nên phần lớn test hiện có giữ nguyên câu chữ.
