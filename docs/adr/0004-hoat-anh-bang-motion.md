# ADR 0004: Hoạt ảnh giao diện bằng Motion

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-11-27

## Bối cảnh

Giao diện theo phong cách Liquid Glass cần hoạt ảnh kiểu iOS 26: bong bóng kính trượt và co giãn từ tab cũ sang tab mới. CSS thuần không làm được việc này, vì bong bóng phải đổi phần tử cha khi đổi tab. Hoạt ảnh không được làm giật trang: trước đó việc lạm dụng `backdrop-filter` đã kéo thời gian mỗi khung hình khi cuộn từ 17 ms lên 38 ms.

Các lựa chọn đã xét:

- **Motion** (`motion`, trước là Framer Motion): thư viện hoạt ảnh React phổ biến nhất. Hoạt ảnh chạy ngoài chu trình render của React (motion value, Web Animations API, transform). Có `layoutId` cho hoạt ảnh chuyển phần tử chung. `LazyMotion` giữ phần tải đầu nhỏ.
- **GSAP**: mạnh, miễn phí, nhưng viết kiểu mệnh lệnh, phải tự nối với vòng đời React và không có sẵn hoạt ảnh layout dùng chung.
- **React Spring**: lò xo tốt, ít người dùng hơn, không có `layoutId`.
- **AutoAnimate**: rất nhẹ nhưng chỉ làm hiệu ứng thêm và bớt phần tử danh sách.
- **View Transitions API**: có sẵn trong trình duyệt nhưng chưa đủ trên Firefox, khó giới hạn trong một nhóm tab.

## Quyết định

- Dùng **`motion`** trong `apps/web`. `MotionProvider` (`components/common/motion-provider.tsx`) bọc app bằng `LazyMotion strict`, gói tính năng `domMax` (`lib/motion-features.ts`) tải sau lần vẽ đầu. Chỉ dùng `m.*`, không dùng `motion.*`.
- `MotionConfig reducedMotion="user"`: người dùng bật giảm chuyển động thì hoạt ảnh transform tắt, giao diện nhảy thẳng tới trạng thái cuối.
- Chỉ dùng Motion ở chỗ CSS không làm được. Hiện có `GlassTabIndicator` và `GlassTabGroup` (`components/ui/glass-tabs.tsx`) cho mọi nhóm tab. Menu, hộp thoại, nút nhấn và phản hồi đúng sai vẫn dùng hoạt ảnh CSS trong `globals.css`.
- Hoạt ảnh chỉ đổi `transform` và `opacity`, không đổi kích thước hay vị trí bằng thuộc tính layout. Mỗi nhóm tab có `LayoutGroup` riêng để bong bóng không bay giữa các nhóm.

## Hệ quả

- Thêm khoảng 5 KB vào phần tải đầu, gói `domMax` (khoảng 25 KB) tải sau.
- Tab mới phải dùng `GlassTabGroup` và `GlassTabIndicator`, tab chứa bong bóng có `relative isolate`.
- Test chạy trong jsdom vẫn hoạt động vì `m.span` render như `span` thường khi chưa có tính năng.
