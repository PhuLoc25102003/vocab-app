---
name: ui-component
description: Dùng khi tạo hoặc sửa component, trang, form, trạng thái giao diện trong apps/web của vocab-app, kể cả chỉnh màu, chữ, khoảng cách, responsive và accessibility.
---

# Tạo hoặc sửa component giao diện

Đọc trước: `docs/05-ui-tokens.md`. Đây là nguồn chuẩn duy nhất cho token.

## Đặt file ở đâu

| Loại                                  | Vị trí                                          |
| ------------------------------------- | ----------------------------------------------- |
| Thành phần cơ bản: nút, input, dialog | `apps/web/src/components/ui/<tên>.tsx`          |
| Dùng nhiều tính năng: `empty-state`   | `apps/web/src/components/common/<tên>.tsx`      |
| Thuộc một tính năng                   | `apps/web/src/features/<tính-năng>/components/` |
| Route                                 | `apps/web/src/app`, chỉ gọi component           |

Tên file kebab-case, tên component PascalCase. Chỉ thêm `'use client'` khi cần state, effect hoặc API trình duyệt. Component không gọi `fetch`, dữ liệu đi qua hook của feature.

## Thành phần có sẵn

Dùng lại trước khi viết mới:

| Cần                    | Dùng                                                       |
| ---------------------- | ---------------------------------------------------------- |
| Gộp class              | `cn()` trong `@/lib/utils`                                 |
| Nút, liên kết dạng nút | `Button`: `variant`, `size="icon"`, `loading`, `asChild`   |
| Giữ chỗ khi tải        | `LoadingState` bọc `Skeleton`                              |
| Tiêu đề trang          | `PageHeader`                                               |
| Không có dữ liệu, lỗi  | `EmptyState`, `ErrorState`                                 |
| Thông báo ngắn         | `toast()` của `sonner`, `Toaster` đã gắn trong `Providers` |
| Đọc hoặc đổi giao diện | `useTheme()` trong `@/lib/use-theme`                       |

Thêm component shadcn bằng `npx shadcn@latest add <tên>` trong `apps/web`, rồi đổi toàn bộ class sang token của dự án. Không để lệnh này sửa `globals.css`.

## Quy tắc thiết kế

- Màu: chỉ class từ token như `bg-surface`, `text-text-muted`, `border-border-strong`.
- Chữ: `text-h1`, `text-h2`, `text-h3`, `text-body`, `text-small`, `text-tiny`, `text-card`, `text-card-long`.
- Khoảng cách: `1 2 3 4 6 8 12 16`. Bo góc: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-full`.
- Danh sách là các dòng kẻ. Không tạo lưới thẻ bo góc có đổ bóng.
- `shadow-raised` và `rounded-lg` dành cho flashcard và dialog.
- Viền điều khiển dùng `border-border-strong`, chữ trên highlight dùng `text-highlight-fg`.
- Không có token phù hợp thì đề xuất thêm vào `docs/05-ui-tokens.md`, không tự viết giá trị.

## Mẫu

```tsx
import type { ButtonHTMLAttributes } from 'react';

export function SecondaryButton({
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`min-h-11 rounded-md border border-border-strong bg-surface px-4 font-medium transition-colors duration-fast ease-standard hover:bg-primary-soft disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
```

```tsx
export function SetListEmpty() {
  return (
    <div className="flex max-w-[65ch] flex-col items-start gap-3 py-12">
      <h2 className="text-h2">Chưa có bộ từ nào</h2>
      <p className="text-text-muted">Tạo bộ đầu tiên hoặc nhập từ file.</p>
      <Button>Tạo bộ từ</Button>
    </div>
  );
}
```

## Chữ tiếng Việt

- Nút nói rõ việc sẽ xảy ra: "Lưu bộ từ", không dùng "OK" hay "Submit".
- Một hành động giữ một tên: "Lưu bộ từ" rồi "Đã lưu bộ từ".
- Lỗi nói sai gì và cách sửa. Trang trống mời một hành động.
- Xưng "bạn", câu ngắn, viết hoa chữ đầu câu.

## Checklist cuối

- [ ] Không có hex, class màu mặc định, cỡ chữ mặc định, `style={{ color }}`
- [ ] Có loading, empty, error, success nếu component hiển thị dữ liệu
- [ ] Đúng ở light và dark (thêm class `dark` vào `<html>` để kiểm tra)
- [ ] Dùng được bằng bàn phím, vòng focus thấy rõ, thứ tự tab hợp lý
- [ ] Vùng bấm tối thiểu 44 × 44 px
- [ ] Không tràn ngang ở 360 px, chữ dài và dấu tiếng Việt không bị cắt
- [ ] Với `prefers-reduced-motion`, chuyển động về 0 và chức năng vẫn đủ
- [ ] Input có `label`, lỗi nối bằng `aria-describedby`, nút chỉ có icon có `aria-label`
- [ ] Đúng sai có icon và chữ, không chỉ dựa vào màu
- [ ] Đã xem trên trình duyệt thật
