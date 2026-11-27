# Rà soát hiệu năng web (2026-11-27)

Đo trên bản build production chạy local (`next build && next start`, API local), Chromium, CPU giảm tốc 4 lần để giống điện thoại tầm trung. Phần "Đã làm" ở cuối ghi các việc đã sửa (việc 7.15), phần "Còn lại" là việc để sau.

## Kết quả đo

| Hạng mục                                   | Số đo                                            | Đánh giá                    |
| ------------------------------------------ | ------------------------------------------------ | --------------------------- |
| Cuộn trang (Tổng quan, Bộ từ, Ôn tập, ...) | Khung hình tệ nhất 17–50 ms, gần như không giật  | Tốt                         |
| Bấm tab điều hướng (INP)                   | 48–64 ms                                         | Tốt (ngưỡng tốt là 200 ms)  |
| Lật thẻ, chuyển thẻ bằng phím              | khoảng 40 ms                                     | Tốt                         |
| Đổi giao diện sáng tối                     | 144–160 ms                                       | Chấp nhận được              |
| Mở chuông thông báo ngay sau đổi giao diện | 240 ms, gần hết là chờ luồng chính               | Hơi chậm                    |
| API local                                  | 10–110 ms mỗi request, chạy song song            | Tốt                         |
| API production qua Vercel                  | khoảng 250–320 ms mỗi request (Render Singapore) | Bình thường                 |
| JS tải lần đầu ở Tổng quan                 | 26 file, 1,45 MB chưa nén, khoảng 540 KB gzip    | **Nặng, nguyên nhân chính** |
| JS tải sau (prefetch các trang trong menu) | 10 file, 315 KB                                  | Không chặn, tải lúc rảnh    |
| Long task khi tải trang                    | 180–600 ms tổng, task dài nhất 70–250 ms         | Gây "đơ" lúc vừa mở trang   |

Kết luận: khi đã mở xong trang thì cuộn và bấm đều mượt. Cảm giác "đơ" chủ yếu đến từ:

1. **Lúc vừa mở trang**: trình duyệt phải tải và chạy khoảng 1,45 MB JS, điện thoại yếu mất 1–2 giây không bấm được.
2. **Production**: mỗi lần tải lại trang phải chờ `/auth/refresh` xong mới gọi các API khác (thêm một vòng khoảng 300 ms), rồi mỗi API khoảng 300 ms. Render gói Free ngủ sau 15 phút rảnh, request đầu tiên sau đó mất 30–60 giây.
3. **Chạy `npm run dev`**: bản dev chậm hơn production nhiều (biên dịch từng trang khi mở lần đầu, React chạy chế độ kiểm tra). Đánh giá độ mượt nên dùng bản production.

## Thành phần JS lớn lúc tải đầu (đo bằng source map)

| Chunk          | Nội dung                                                  | Ghi chú                                      |
| -------------- | --------------------------------------------------------- | -------------------------------------------- |
| 228 KB, 156 KB | Next.js, React                                            | Không giảm được                              |
| 144 KB         | `zod` (362 KB nguồn) và `@vocab/shared`                   | Dùng để parse phản hồi API                   |
| 142 KB         | **Toàn bộ file dịch của cả `vi` và `en`**                 | Chỉ cần ngôn ngữ đang dùng                   |
| 122 KB         | Radix Dropdown Menu, Floating UI (menu tài khoản, chuông) | Chỉ cần khi bấm mở menu                      |
| 109 KB         | `motion-dom`, `framer-motion` (tab kính có `layoutId`)    | Đã dùng `LazyMotion`, vẫn tải ngay khi mount |
| 50 KB          | `i18next`                                                 | Cần                                          |
| 42 KB          | `sonner` (toast)                                          | Có thể tải khi có toast đầu tiên             |

## Rà API gọi thừa và lặp

Script tạm `e2e/zz-api.spec.ts` ghi mọi request API của từng trang (tải đầy đủ và chuyển trang phía client) ở cả ba vai trò.

- Mỗi lần tải trang: một `POST /auth/refresh`, một `GET /notifications/unread-count`, còn lại là dữ liệu của trang, chạy song song. Chuyển trang phía client dùng lại cache, không gọi lại.
- **Lặp duy nhất:** trang Lớp học gọi `/classes/joined` hai lần (`limit=100` cho ô lọc lớp, `limit=20` cho danh sách lớp), trang Xếp hạng gọi lại lần nữa với khoá cache khác.
- Tổng quan gọi lại `/stats/xp` và `/stats/overview` mỗi lần quay về (`staleTime: 0`). Giữ nguyên vì cần số mới sau khi học, dữ liệu cũ vẫn hiện ngay trong lúc tải.

## Đã làm (việc 7.15)

1. **Gửi `/auth/refresh` sớm:** script ở `<head>` (`lib/early-refresh.ts`) gửi request ngay lúc đọc HTML, chỉ ở trang trong app và khi có cookie `vocab_session`. `refresh()` dùng lại kết quả đúng một lần, lỗi mạng thì gửi lại như cũ. Đo bản build: refresh bắt đầu 70–140 ms sau khi mở trang, ở Tổng quan (CPU giảm 4 lần) sớm hơn các API khác khoảng 1,4 giây, trước đây phải đợi đến lúc đó mới gửi. Trên production bỏ được một vòng chờ khoảng 300 ms mỗi lần tải lại trang.
2. **Chỉ tải tiếng Anh khi cần:** bundle client chỉ có `vi`. Trang mở bằng tiếng Anh nhận bộ `en` từ root layout, đổi ngôn ngữ thì tải `messages-en.ts` trước. `global-error.tsx` chuyển sang đọc namespace `errors` nhỏ. Kết quả: chuỗi tiếng Anh chỉ còn trong một chunk tải khi cần (60 KB), trước đây nằm trong chunk chung của mọi trang (khoảng 70 KB) và một chunk 17 KB của trang lỗi.
3. **Một request `/classes/joined`:** ô lọc lớp, trang đầu danh sách lớp và tab của Xếp hạng dùng chung khoá `['classes', 'joined', 1, '', 100]`. Trang đầu cắt 20 lớp từ danh sách đầy đủ, cùng thứ tự với API.

Toàn bộ unit test, typecheck, lint và 30 E2E đều qua.

## Còn lại

1. **Giữ API production không ngủ** (không đụng code, cần bạn làm): tạo monitor miễn phí ở uptimerobot.com gọi `https://vocab-app-rj0t.onrender.com/api/v1/health` mỗi 5 phút. Bỏ được lần chờ 30–60 giây sau khi rảnh. Render Free có 750 giờ mỗi tháng, đủ cho một service chạy liên tục.
2. **Menu Radix (khoảng 120 KB):** không tách được cho riêng header vì `Menu` dùng ở 12 chỗ (tiêu đề trang, thẻ bộ từ, danh sách bộ từ, Khám phá). Muốn giảm phải đổi `components/ui/menu.tsx` sang tải khi mở, ảnh hưởng mọi menu nên để sau.
3. **Bật React Compiler** (`reactCompiler: true`, cài `babel-plugin-react-compiler`): tự memo, giảm render lại ở Mưa từ và danh sách dài. Thao tác hiện đã dưới 70 ms nên lợi ích nhỏ, build chậm hơn.
4. **Giảm blur kính trên điện thoại** (`@media (pointer: coarse)`, `blur(30px)` xuống khoảng `16px`): làm khi thấy giật lúc cuộn trên máy thật, vì có đổi nhẹ giao diện.

Không nên làm: đổi `zod` sang `zod/mini` (phải sửa toàn bộ schema dùng chung, lợi ích không tương xứng).

## Cách đo lại

Script đo tạm `apps/web/e2e/zz-perf.spec.ts` và `zz-api.spec.ts` (đã loại khỏi git qua `.git/info/exclude`): đăng ký tài khoản, tạo dữ liệu, mở từng trang, ghi long task, khung hình khi cuộn, số request API, JS tải, độ trễ khi bấm.

```bash
cd apps/web
MSYS_NO_PATHCONV=1 PERF_PAGES=/dashboard,/sets npx playwright test e2e/zz-perf.spec.ts
MSYS_NO_PATHCONV=1 PERF_INTERACT=1 PERF_PAGES=/review npx playwright test e2e/zz-perf.spec.ts
```

Biến: `PERF_CPU` (mặc định 4), `PERF_W` (bề rộng, mặc định 1280), `PERF_PAGES`, `PERF_INTERACT`.
