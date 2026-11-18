# UI và design tokens

Tài liệu này là chuẩn thiết kế. Code giao diện chỉ dùng token theo vai trò (`bg-surface`, `text-danger`), không viết mã hex.

## Ý tưởng: vở ô li và mực tím

Lấy từ đồ dùng học tập của học sinh Việt Nam: giấy kẻ ô li, mực tím, bảng xanh, bút đỏ chấm bài, bút dạ quang, giấy than.

- **Điểm nhấn duy nhất:** flashcard. Mặt trước là giấy ô li thật (4 dòng li trong mỗi ô lớn), mặt sau là bảng xanh. Từ vựng đặt bằng chữ có chân như mục từ trong từ điển.
- **Chấm như thầy cô:** chế độ Viết gạch đỏ chỗ sai, ghi đáp án đúng màu xanh bên cạnh.
- **Mọi thứ khác yên tĩnh:** nền phẳng, không gradient, không lưới thẻ bo góc. Danh sách là các dòng kẻ như trang vở.
- **Một màn hình, một việc chính:** tối đa một nút primary trong mỗi vùng nhìn.
- **Chuyển động chỉ để phản hồi thao tác:** lật thẻ, báo đúng sai, hoàn thành phiên.

Tránh: nền oải hương với nút tím xanh kiểu SaaS, gradient trang trí, thẻ giống nhau xếp lưới, nhãn viết hoa toàn bộ, chuỗi thông tin nối bằng dấu chấm giữa.

## Bảng màu gốc

| Tên          | Light     | Dark      | Ý nghĩa                                 |
| ------------ | --------- | --------- | --------------------------------------- |
| Giấy vở      | `#FAFAF7` | –         | Nền trang, trắng trung tính             |
| Giấy than    | –         | `#16141B` | Nền tối, đen hơi ngả tím                |
| Mực đen      | `#211D2E` | `#F2EFF5` | Chữ chính                               |
| Dòng kẻ      | `#E3DFEC` | `#373240` | Viền nhẹ, ô lớn của vở                  |
| Mực tím      | `#5F1A9B` | `#C9A4F4` | Màu chính, tím mực nho thay vì tím xanh |
| Bảng xanh    | `#1F4D45` | `#1F4D45` | Mặt sau flashcard                       |
| Bút đỏ       | `#BF2A20` | `#FF8B7F` | Sai, lỗi                                |
| Bút xanh     | `#17774C` | `#5CD6A2` | Đúng                                    |
| Bút dạ quang | `#FFE14D` | `#FFE14D` | Highlight, streak                       |

## Token theo vai trò

Component chỉ dùng tên token. Cột tương phản ghi light / dark, đã đo theo công thức WCAG 2.x. Chữ cần ít nhất 4.5:1, viền điều khiển và icon cần ít nhất 3:1.

| Token             | Light       | Dark      | Dùng cho                                 | Tương phản                |
| ----------------- | ----------- | --------- | ---------------------------------------- | ------------------------- |
| `--bg`            | `#FAFAF7`   | `#16141B` | Nền trang                                | –                         |
| `--surface`       | `#FFFFFF`   | `#211E29` | Panel, input, mặt trước flashcard        | –                         |
| `--border`        | `#E3DFEC`   | `#373240` | Đường chia, viền trang trí, ô lớn        | Không dùng cho điều khiển |
| `--border-strong` | `#857E94`   | `#827B90` | Viền input, nút phụ, đáp án              | 3.88 / 4.04 trên surface  |
| `--rule`          | `#F0EDF5`   | `#2A2632` | Dòng li nhỏ của `.paper-grid`            | Chỉ trang trí             |
| `--text`          | `#211D2E`   | `#F2EFF5` | Chữ chính                                | 15.69 / 16.04 trên bg     |
| `--text-muted`    | `#5F5A6E`   | `#B1ABBC` | Chữ phụ, placeholder                     | 6.33 / 8.19 trên bg       |
| `--primary`       | `#5F1A9B`   | `#C9A4F4` | Nút chính, link, tiến độ                 | 9.53 / 8.78 trên bg       |
| `--primary-hover` | `#4C1480`   | `#D9BDF8` | Hover của nút chính                      | 12.22 / 10.74 với chữ nút |
| `--primary-fg`    | `#FFFFFF`   | `#1B1424` | Chữ trên nút chính                       | 9.96 / 8.62               |
| `--primary-soft`  | `#F3EBFA`   | `#33264A` | Nền tag, mục đang chọn, hover nút phụ    | Chữ primary 8.58 / 6.66   |
| `--board`         | `#1F4D45`   | `#1F4D45` | Mặt sau flashcard                        | –                         |
| `--board-fg`      | `#F6F8F2`   | `#F6F8F2` | Chữ chính trên bảng                      | 8.90                      |
| `--board-muted`   | `#BFD6CC`   | `#BFD6CC` | Ví dụ, chữ phụ trên bảng                 | 6.21                      |
| `--danger`        | `#BF2A20`   | `#FF8B7F` | Chữ báo sai, lỗi form                    | 5.89 / 7.21 trên surface  |
| `--danger-mark`   | `#DE3A2E`   | `#FF8B7F` | Đường gạch, viền, icon sai               | 4.42 / 7.21               |
| `--danger-soft`   | `#FCEDEA`   | `#43211F` | Nền đáp án sai                           | Chữ danger 5.17 / 6.27    |
| `--success`       | `#17774C`   | `#5CD6A2` | Chữ báo đúng                             | 5.56 / 9.04 trên surface  |
| `--success-mark`  | `#259A66`   | `#5CD6A2` | Viền, icon đúng                          | 3.56 / 9.04               |
| `--success-soft`  | `#E6F5EE`   | `#173A2C` | Nền đáp án đúng                          | Chữ success 4.94 / 6.91   |
| `--highlight`     | `#FFE14D`   | `#FFE14D` | Highlight, streak                        | –                         |
| `--highlight-fg`  | `#211D2E`   | `#211D2E` | Chữ trên highlight, không đổi theo theme | 12.60                     |
| `--focus`         | `#5F1A9B`   | `#C9A4F4` | Vòng focus 2px                           | 9.53 / 8.78 trên bg       |
| `--overlay`       | mực đen 50% | đen 60%   | Nền mờ sau dialog                        | –                         |

Quy tắc:

- Không dùng `-mark` cho chữ nhỏ.
- Đúng và sai luôn kèm icon và chữ, không chỉ báo bằng màu.
- Chữ trên `bg-highlight` luôn dùng `text-highlight-fg`.
- Viền của input, nút phụ và đáp án luôn dùng `border-border-strong`.

## Typography

| Font                | Class           | Dùng cho                            | Lý do                                                 |
| ------------------- | --------------- | ----------------------------------- | ----------------------------------------------------- |
| Be Vietnam Pro      | `font-sans`     | Toàn bộ giao diện                   | Thiết kế cho tiếng Việt, dấu không chồng              |
| Literata (variable) | `font-card`     | Từ và nghĩa trên thẻ, ô nhập đáp án | Có optical size, đọc rõ, mang cảm giác mục từ từ điển |
| Noto Serif 400      | `font-phonetic` | Phiên âm IPA                        | Literata và Be Vietnam Pro thiếu nhiều ký tự IPA      |

Nạp bằng `next/font/google`. Noto Serif đặt `preload: false` vì chỉ cần khi thẻ có phiên âm.

| Class            | Cỡ                    | Line-height | Weight | Dùng cho                           |
| ---------------- | --------------------- | ----------- | ------ | ---------------------------------- |
| `text-card`      | 36 đến 48 px, co giãn | 1.2         | 500    | Từ ngắn trên flashcard             |
| `text-card-long` | 24 đến 32 px, co giãn | 1.25        | 500    | Cụm từ dài hơn 24 ký tự, nghĩa dài |
| `text-h1`        | 28 đến 36 px, co giãn | 1.25        | 700    | Tiêu đề trang, mỗi trang một       |
| `text-h2`        | 24 px                 | 32 px       | 600    | Tiêu đề mục                        |
| `text-h3`        | 18 px                 | 28 px       | 600    | Tên bộ từ, tiêu đề dialog          |
| `text-body`      | 16 px                 | 24 px       | 400    | Nội dung, input                    |
| `text-small`     | 14 px                 | 24 px       | 400    | Chú thích, thông tin phụ           |
| `text-tiny`      | 12 px                 | 20 px       | 500    | Badge, số đếm                      |

- Line-height là bội của 4 px và rộng hơn thông thường để dấu tiếng Việt không chạm dòng trên.
- Đoạn văn tối đa 65 ký tự mỗi dòng (`max-w-[65ch]`).
- Ô nhập tối thiểu 16 px để iOS không tự phóng to.
- Viết hoa chữ đầu câu. Không viết hoa toàn bộ, không tăng giãn chữ cho nhãn.
- Số đếm trong tiến độ và điểm dùng `tabular-nums`.

## Spacing, bố cục, bo góc

| Nhóm       | Giá trị                                               | Quy tắc                                                      |
| ---------- | ----------------------------------------------------- | ------------------------------------------------------------ |
| Spacing    | 4, 8, 12, 16, 24, 32, 48, 64 px (`1 2 3 4 6 8 12 16`) | Trong component 8 đến 16, giữa các nhóm 24, giữa các mục 48  |
| Lề trang   | 16 px mobile, 24 px từ `md`, 32 px từ `lg`            | Không để nội dung chạm mép                                   |
| Độ rộng    | App 1120 px, vùng học và form 720 px, đoạn văn 65ch   | Căn trái, chỉ nội dung flashcard căn giữa                    |
| Breakpoint | `sm` 640, `md` 768, `lg` 1024, `xl` 1280              | Thiết kế từ 360 px trở lên                                   |
| Bo góc     | `sm` 4, `md` 8, `lg` 16, `full`                       | Tag `sm`; nút, input, panel `md`; chỉ flashcard, dialog `lg` |
| Đổ bóng    | `shadow-raised`                                       | Chỉ flashcard và dialog                                      |
| Vùng bấm   | Tối thiểu 44 × 44 px                                  | Nút thường `min-h-11`, đáp án `min-h-12`                     |

## Chuyển động

| Token           | Giá trị                          | Dùng cho             |
| --------------- | -------------------------------- | -------------------- |
| `duration-fast` | 120 ms                           | Hover, nhấn          |
| `duration-base` | 200 ms                           | Dialog, báo đúng sai |
| `duration-flip` | 450 ms                           | Lật thẻ              |
| `ease-standard` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Mọi chuyển động      |

Các duration về 0 khi người dùng bật `prefers-reduced-motion`, lúc đó thẻ đổi mặt ngay. Không animate khi tải trang.

## Trạng thái component

| Component            | Mặc định                                                                   | Hover               | Focus                   | Disabled                  |
| -------------------- | -------------------------------------------------------------------------- | ------------------- | ----------------------- | ------------------------- |
| Nút chính            | `bg-primary text-primary-fg`                                               | `bg-primary-hover`  | Vòng 2px, cách 2px      | `opacity-50`, không click |
| Nút phụ              | `border-border-strong bg-surface`                                          | `bg-primary-soft`   | Như trên                | Như trên                  |
| Input                | `border-border-strong bg-surface`                                          | `border-text-muted` | `border-primary` + vòng | Nền `bg`                  |
| Đáp án               | `border-border-strong bg-surface`                                          | `bg-primary-soft`   | Vòng focus              | –                         |
| Đáp án đúng          | Viền 2px `success-mark`, nền `success-soft`, chữ `success`, icon ✓         | –                   | –                       | –                         |
| Đáp án sai           | Viền 2px `danger-mark`, nền `danger-soft`, chữ `danger` gạch ngang, icon ✗ | –                   | –                       | –                         |
| Dòng trong danh sách | `border-b border-border`, cao tối thiểu 64 px                              | `bg-primary-soft`   | Vòng focus              | –                         |

Nút đang gửi giữ nguyên kích thước, hiện vòng xoay và khoá bấm lại.

## Bốn trạng thái dữ liệu

| Trạng thái | Cách hiển thị                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| Loading    | Skeleton đúng hình nội dung. Sau 3 giây thêm "Máy chủ đang khởi động, có thể mất khoảng 30 giây."                    |
| Empty      | Một câu nói tình trạng và một hành động chính                                                                        |
| Error      | Nói việc gì không làm được, cách xử lý, và nút "Thử lại". Lỗi form đặt ngay dưới ô nhập, nối bằng `aria-describedby` |
| Success    | Nội dung thật. Sau thao tác, thông báo ngắn cùng tên với hành động                                                   |

Xoá mềm dùng thông báo có nút "Hoàn tác" thay cho hộp xác nhận. Chỉ xác nhận khi không hoàn tác được. API chưa có endpoint khôi phục bộ từ, nên hiện tại xoá bộ từ phải xác nhận.

## Màn hình học

- Ẩn điều hướng, chỉ còn nút thoát, tiến độ dạng đường kẻ cao 4 px và số `12/40`.
- Vùng học rộng tối đa 720 px. Trên mobile, hành động chính nằm ở nửa dưới màn hình.
- Phím tắt: `Space` lật thẻ, `1` đến `4` chọn đáp án, `Enter` gửi. Chỉ gợi ý phím tắt trên thiết bị có bàn phím.
- Chữ nhỏ trên `.paper-grid` đặt trên nền `bg-surface` để dòng kẻ không cắt qua chữ.
- Nút phát âm nằm cố định một vị trí trên thẻ, không làm lật thẻ khi bấm.

## Giọng văn trên giao diện

- Nút nói rõ việc sẽ xảy ra: "Lưu bộ từ", "Bắt đầu ôn", "Nhập danh sách từ"; không dùng "Submit", "OK".
- Một hành động giữ một tên xuyên suốt: nút "Lưu bộ từ" → thông báo "Đã lưu bộ từ".
- Lỗi nói rõ sai gì và cách sửa: "Dòng 12 thiếu nghĩa. Thêm nghĩa hoặc xoá dòng này."
- Trang trống mời hành động: "Chưa có bộ từ nào. Tạo bộ đầu tiên hoặc nhập từ file."
- Xưng hô "bạn", câu ngắn, thân thiện với học sinh. Không xin lỗi dài dòng, không dùng từ kỹ thuật.

## Cấm trong code

Class màu mặc định của Tailwind (`bg-purple-600`, `text-red-500`, `text-white`), mã hex trong `.tsx`, `style={{ color }}` cố định, cỡ chữ mặc định (`text-sm`, `text-2xl`), bo góc và đổ bóng ngoài token. Theme đã xoá các giá trị mặc định này nên Tailwind không sinh ra class tương ứng.

## Token trong code

Token nằm trong `apps/web/src/app/globals.css`, font nạp trong `apps/web/src/app/layout.tsx`. Khi đổi token, sửa `globals.css` và bảng trong tài liệu này cùng commit.

## Đã điều chỉnh so với spec gốc

| Hạng mục           | Cũ                             | Mới                                                                              | Lý do                                          |
| ------------------ | ------------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------- |
| Màu chính          | `#5B3FD1` tím xanh             | `#5F1A9B` tím mực                                                                | Gần màu mực thật, tách khỏi kiểu SaaS phổ biến |
| Nền                | Oải hương lạnh, dark xanh chàm | Giấy trung tính, dark giấy than                                                  | Cùng lý do                                     |
| Viền điều khiển    | `--border`, chỉ 1.35:1         | Thêm `--border-strong`, 3.88:1                                                   | WCAG 1.4.11 yêu cầu 3:1                        |
| Chữ trên highlight | `--text`, chỉ 1.18:1 ở dark    | Thêm `--highlight-fg`, 12.60:1                                                   | Sửa lỗi đọc không được ở dark                  |
| Token mới          | –                              | `primary-hover`, `rule`, `board-muted`, `danger-soft`, `success-soft`, `overlay` | Đủ cho trạng thái component                    |
| Font thẻ           | Lexend                         | Literata                                                                         | Tạo cá tính từ điển                            |
| Phiên âm           | Không quy định                 | Noto Serif                                                                       | Đủ ký tự IPA, đã kiểm tra trên trình duyệt     |
| Thang chữ          | h1 30, h2 22, card 40          | h1 28–36, h2 24, card 36–48                                                      | Thang rõ hơn, co giãn theo màn hình            |
| Bo góc             | 6, 10, 16                      | 4, 8, 16                                                                         | Bội của 4, chỉ flashcard và dialog bo lớn      |
| `.paper-grid`      | Ô vuông 24 px                  | Ô 32 px, 4 dòng li 8 px                                                          | Đúng cấu trúc vở ô li                          |
| Danh sách          | Không quy định                 | Dòng kẻ thay cho lưới thẻ                                                        | Giữ flashcard là điểm nhấn duy nhất            |
| Biến CSS           | `--dur-*`, `--font-be-vietnam` | `--duration-*`, `--font-be-vietnam-pro`                                          | Khớp code hiện tại                             |
| Theme Tailwind     | Giữ bảng mặc định              | Xoá màu, cỡ chữ, bo góc, đổ bóng mặc định                                        | Lỗi dùng sai lộ ra ngay                        |
