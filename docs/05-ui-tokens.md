# UI và design tokens

Tài liệu này là chuẩn thiết kế. Code giao diện chỉ dùng token theo vai trò (`bg-surface`, `text-danger`), không viết mã hex.

## Ý tưởng: vở ô li và mực tím

Lấy từ đồ dùng học tập của học sinh Việt Nam: giấy kẻ ô li, mực tím, bảng xanh, bút đỏ chấm bài, bút dạ quang, giấy than.

- **Điểm nhấn duy nhất:** flashcard. Mặt trước là giấy ô li thật (4 dòng li trong mỗi ô lớn), mặt sau là bảng xanh. Từ vựng đặt bằng chữ có chân như mục từ trong từ điển.
- **Chấm như thầy cô:** chế độ Viết gạch đỏ chỗ sai, ghi đáp án đúng màu xanh bên cạnh.
- **Mọi thứ khác yên tĩnh:** nền phẳng, không gradient. Bộ từ hiện bằng một thẻ dùng chung (`SetCardGrid`) ở mọi nơi để người dùng nhận ra ngay; danh sách khác (thẻ trong bộ, thành viên, người dùng) là các dòng kẻ như trang vở.
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

| Font                | Class           | Dùng cho                            | Lý do                                            |
| ------------------- | --------------- | ----------------------------------- | ------------------------------------------------ |
| Be Vietnam Pro      | `font-sans`     | Toàn bộ giao diện                   | Thiết kế cho tiếng Việt, dấu không chồng         |
| Literata (variable) | `font-card`     | Từ và nghĩa trên thẻ, ô nhập đáp án | Đọc rõ, mang cảm giác mục từ từ điển             |
| Noto Serif 400      | `font-phonetic` | Phiên âm IPA                        | Literata và Be Vietnam Pro thiếu nhiều ký tự IPA |

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

| Nhóm       | Giá trị                                               | Quy tắc                                                                                                               |
| ---------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Spacing    | 4, 8, 12, 16, 24, 32, 48, 64 px (`1 2 3 4 6 8 12 16`) | Trong component 8 đến 16, giữa các nhóm 24, giữa các mục 48                                                           |
| Lề trang   | 16 px mobile, 24 px từ `md`, 32 px từ `lg`            | Không để nội dung chạm mép                                                                                            |
| Độ rộng    | App 1120 px, vùng học và form 720 px, đoạn văn 65ch   | Trang form dùng `PageContainer width="narrow"`: khối 720 px căn giữa gồm cả tiêu đề; trang danh sách dùng hết 1120 px |
| Breakpoint | `sm` 640, `md` 768, `lg` 1024, `xl` 1280              | Thiết kế từ 360 px trở lên                                                                                            |
| Bo góc     | `sm` 4, `md` 8, `lg` 16, `full`                       | Tag `sm`; nút, input, panel `md`; chỉ flashcard, dialog `lg`                                                          |
| Đổ bóng    | `shadow-raised`                                       | Chỉ flashcard và dialog                                                                                               |
| Vùng bấm   | Tối thiểu 44 × 44 px                                  | Nút thường `min-h-11`, đáp án `min-h-12`                                                                              |

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
| Danh sách          | Không quy định                 | Bộ từ dùng lưới thẻ chung, danh sách khác dùng dòng kẻ                           | Bộ từ trông giống nhau ở mọi trang (2.29)      |
| Biến CSS           | `--dur-*`, `--font-be-vietnam` | `--duration-*`, `--font-be-vietnam-pro`                                          | Khớp code hiện tại                             |
| Theme Tailwind     | Giữ bảng mặc định              | Xoá màu, cỡ chữ, bo góc, đổ bóng mặc định                                        | Lỗi dùng sai lộ ra ngay                        |

## Phân trang

Danh sách có thể dài hơn một màn hình thì phân trang bằng `Pagination` (`components/common/pagination.tsx`), không tải hết rồi bắt cuộn mãi: nút Trước, Sau (viền `border-strong`, 44 px) và "Trang x/y" ở giữa; chỉ có một trang thì ẩn.

- Danh sách chính của trang (bộ từ, Khám phá, lớp, người dùng, bài đã giao, học sinh, lớp đã tham gia) để số trang trong URL bằng `hrefFor` để nút quay lại và tải lại giữ đúng trang. Hai danh sách trên cùng trang dùng tham số riêng và giữ tham số của nhau (trang lớp: `page` cho học sinh, `apage` cho bài đã giao).
- Danh sách nằm trong một phần của trang đã tải đủ dữ liệu (thẻ trong trang bộ từ và trang công khai, 50 thẻ một trang) đổi trang bằng `onPageChange`, rồi cuộn về đầu danh sách. `ol` có `start` để số thứ tự liền mạch, nhãn "Thẻ 51 đến 100 trên 120".
- Ngoại lệ: danh sách thẻ trong trình soạn bộ từ dùng khung cuộn riêng.

## Chữ dài

Tên bộ, mô tả, tên người dùng, tên lớp, thư mục và thuật ngữ do người dùng nhập, có thể là chuỗi rất dài không có dấu cách (đường dẫn, từ ghép). Không để chữ tràn khỏi thẻ, hàng hay menu và không để trang cuộn ngang ở 360 px.

- `body` có `overflow-wrap: break-word` làm lưới an toàn cho khối thường.
- Trong hàng `flex` hoặc `grid`, phần tử chứa chữ có `min-w-0`. Chữ được xuống dòng thì dùng `wrap-anywhere` (vì `break-words` không giảm độ rộng tối thiểu của phần tử flex, chữ vẫn đẩy hàng rộng ra).
- Cần gọn thì cắt dòng: tên trên thẻ bộ từ `line-clamp-2`, mô tả `line-clamp-1` hoặc `line-clamp-2`, tên trong menu, cột thư mục, đường dẫn thư mục và mục kéo thả dùng `truncate`.
- Kiểm tra bằng chuỗi 120 ký tự không dấu cách ở 360 px: `document.documentElement.scrollWidth` phải bằng 360.

## Ô chọn

Dùng `Select` trong `components/ui/select.tsx`, không viết `select` trần. Component giữ thẻ `select` gốc để form, bàn phím, trình đọc màn hình và bộ chọn trên điện thoại vẫn đúng, chỉ thay giao diện. Trình duyệt hỗ trợ `appearance: base-select` thì danh sách lựa chọn dùng `--surface`, `--border`, `--shadow-raised`, mục được chọn có dấu tích màu `--primary` (lớp `select-styled` trong `globals.css`).

## Ô ngày giờ

Dùng `DateTimeField` trong `components/common/date-time-field.tsx`, không dùng `input type="datetime-local"` hay `type="date"` vì ô gốc hiện theo ngôn ngữ máy (`mm/dd/yyyy`, AM/PM) và màu của trình duyệt.

- `fieldset` có `legend` là nhãn. Hàng trên: ô ngày (`aria-label="Ngày"`, gõ `dd/mm/yyyy`, nhận cả `-` và `.`), nút biểu tượng lịch 44 px, ô giờ (`aria-label="Giờ"`, 24 tiếng, gõ `2130` hay `9` cũng được, rời ô thì chuẩn hoá thành `21:30`). Ngày không có thật hoặc giờ sai thì ô có `aria-invalid`.
- Hàng dưới là chip chọn nhanh cao 44 px, viền `border`, rê chuột viền `primary` nền `primary-soft`: Hết hôm nay, Ngày mai, 1 tuần (đều 23:59) và Không có hạn.
- Lịch nằm trong phần tử `popover="auto"` nên ở lớp trên cùng, không bị cắt trong hộp thoại có thanh cuộn; Esc và bấm ra ngoài thì đóng. Đặt ngay dưới nút lịch, canh phải theo nút, thiếu chỗ thì lên trên, luôn cách mép màn hình 8 px. Rộng 312 px nên vừa 360 px.
- Lịch (`Calendar` trong `components/common/calendar.tsx`, dùng lại được): tiêu đề "Tháng 11, 2026" giữa hai nút Tháng trước, Tháng sau; tuần bắt đầu thứ Hai (T2 đến CN); ô ngày 44 px. Ngày chọn nền `primary` chữ `primary-fg`, hôm nay viền `primary` chữ `primary` (`aria-current="date"`), ngày trước `disablePast` hoặc `minDay` mờ 40% và không bấm được. Phím mũi tên đi qua ngày (lên xuống một tuần), Enter chọn; chọn xong lịch đóng và focus về ô ngày.
- Giá trị nằm trong ô ẩn `name` dạng `YYYY-MM-DDTHH:mm` theo giờ máy (rỗng khi không có hạn, `invalid` khi gõ sai), nơi dùng đổi sang ISO trước khi gửi.
- Không gọi `new Date()` lúc render: ngày hôm nay chỉ đọc khi bấm chip hoặc mở lịch, vì Next cấm giá trị thay đổi theo thời điểm khi prerender.

## Danh sách thẻ khi tạo và sửa bộ từ

Thẻ nằm trong một khung cuộn riêng (`role="region"`, nhãn "Danh sách thẻ", `tabIndex=0` để cuộn bằng bàn phím): viền `border`, nền `surface`, bo `md`, cao tối đa 60% chiều cao màn hình (`60dvh`), tối thiểu 192 px, `overscroll-contain` để cuộn trong khung không kéo cả trang. Nút "Thêm thẻ" và "Lưu bộ từ" nằm ngay dưới khung nên luôn gần tay. Thêm thẻ thì ô "Từ" của thẻ mới nhận focus và khung tự cuộn tới.

## Thẻ bộ từ

Bộ từ ở Bộ từ, Khám phá, "Bộ từ gần đây" của Tổng quan và Ôn hôm nay dùng khung `SetCardShell` trong `components/common/set-card-shell.tsx`; danh sách bộ từ của feature sets bọc nó trong `SetCardGrid`.

- Lưới `SetCardList` đổi cột theo bề rộng vùng chứa (`@container`), không theo màn hình, để thẻ rộng gần bằng nhau ở mọi trang (trang Bộ từ có cột thư mục nên hẹp hơn): 1 cột, 2 cột từ 448 px, 3 cột từ 768 px, 4 cột từ 1024 px; khoảng cách 12 px.
- Thẻ gọn: viền `border-strong`, nền `surface`, bo `md`, padding 12 px, cao tối thiểu 112 px. Hàng đầu là tên bộ chữ thường đậm tối đa 2 dòng, thao tác (nút 44 px) ở góc phải cùng hàng; mô tả `text-small` `text-muted` 1 dòng; hàng cuối `text-small` `text-muted` gồm nhãn (phạm vi hoặc "Đến hạn"), số thẻ, ngày cập nhật dạng `20/11/2026` (`library`, chữ "Cập nhật" cho trình đọc màn hình và trong `title`) hoặc tác giả (`community`). Thiếu chỗ thì ngày hoặc tác giả xuống dòng.
- Cả thẻ bấm được nhờ link phủ toàn thẻ (vùng bấm luôn trên 44 px), thao tác nằm trên lớp link. Hover đổi viền sang `primary` và nền `primary-soft`.
- Skeleton dùng cùng lưới, mỗi ô cao 112 px.

## Trang Ôn hôm nay

Đầu trang là khối tóm tắt nền `board`, chữ `board-fg` và `board-muted`, bo `lg`: số thẻ đến hạn cỡ `text-card`, số bộ có thẻ đến hạn, ô chọn chế độ ôn (chữ trong ô giữ màu `text`) và nút chính nền `board-fg` chữ `board` "Ôn bộ đầu tiên". Dưới đó "Khi nào thẻ đến hạn ôn?" là `details` trông như nút: viền `border-strong`, icon thông tin màu `primary`, chữ "Xem cách tính" và mũi tên xoay 180° khi mở, nền `primary-soft` khi rê chuột; nội dung là bốn bước lịch ôn xếp hai cột. Bộ đến hạn dùng `SetCardShell` với nhãn "Đến hạn", số thẻ đến hạn và nút "Ôn ngay".

## Thư mục trên trang Bộ từ

Trang Bộ từ chia hai cột từ 1024 px: cột thư mục rộng 240 px dính khi cuộn (`FolderPanel`) và danh sách bộ từ. Cột thư mục có "Tất cả bộ từ", "Chưa xếp thư mục" và từng thư mục kèm số bộ; danh sách cuộn riêng, cao tối đa vừa màn hình; có ô lọc khi hơn 6 thư mục; nút biểu tượng tạo thư mục mở ô đặt tên ngay trên cột. Thư mục đang mở có viền và nền `primary`, icon thư mục mở, `aria-current="page"`. Dưới 1024 px cột thành hàng chip cuộn ngang trên danh sách.

Khi mở một thư mục, phía trên danh sách có thanh `FolderHeader`: đường dẫn "Bộ từ › tên thư mục" kèm số bộ, menu ba chấm (đổi tên tại chỗ, xoá qua hộp thoại) và nút đóng về Tất cả. Thư mục đang mở nằm trong URL (`?folder=`). Mỗi thẻ bộ từ có nút biểu tượng thư mục mở menu chọn thư mục và mục "Gỡ khỏi thư mục".

Kéo thả (`FolderDndArea`, thư viện `@dnd-kit/core`): mỗi thẻ có tay nắm chấm dọc 44 px cạnh nút thư mục. Chuột kéo sau 8 px, cảm ứng giữ 250 ms. Khi đang kéo, mọi thư mục nhận thả có viền gạch `primary`; thư mục dưới con trỏ đổi nền `primary`, chữ `primary-fg`. Lớp nổi đi theo con trỏ là chip tên bộ từ có đổ bóng `shadow-raised`. Thả vào "Chưa xếp thư mục" là gỡ khỏi thư mục. Tay nắm ẩn khỏi trình đọc màn hình và không nhận focus vì nút thư mục trên thẻ đã làm cùng việc bằng bàn phím.

## Menu thao tác

Dùng `Menu`, `MenuContent`, `MenuItem`, `MenuRadioItem` trong `components/ui/menu.tsx` (Radix Dropdown Menu), không tự viết danh sách nổi. Mục cao tối thiểu 44 px, nền `primary-soft` khi được chọn bằng chuột hoặc bàn phím, mục xoá dùng `danger` và đặt cuối sau một đường kẻ. Menu tự cuộn khi dài hơn khoảng trống trên màn hình.

Header của trang chỉ có tối đa hai nút: một nút chính của trang và một nút menu "Thao tác khác" (icon ba chấm, có `aria-label`). Thao tác ít dùng như nhập thêm thẻ, tải về máy, xoá nằm trong menu. Thông tin có thể đổi nhanh như thư mục là chip trên dòng thông tin, bấm để mở menu chọn.

## Hộp thoại xác nhận

Mọi thao tác xoá hoặc không hoàn tác được (xoá bộ từ, thư mục, bản offline, thẻ đã có nội dung, đăng xuất mọi thiết bị, xoá tài khoản) hỏi lại bằng `ConfirmDialog` trong `components/common/confirm-dialog.tsx`. Không thay nội dung tại chỗ bằng câu hỏi vì làm xô lệch bố cục.

- Dùng thẻ `dialog` gốc với `showModal()`: khoá focus trong hộp thoại, Esc và bấm nền `overlay` thì huỷ, đóng xong focus trở về nút đã mở. Render qua portal ra `body` để form của hộp thoại không lồng trong form của trang.
- Tiêu đề nói rõ xoá gì (`Xoá bộ từ "Hương 1"?`), mô tả nói hậu quả. Nút huỷ nhận focus đầu tiên. Nút xác nhận dùng biến thể `danger` của `Button` (viền `danger-mark`, nền `danger-soft`, chữ `danger`, đạt AA ở cả hai theme) và hiện vòng quay khi đang xoá; lúc đó không đóng được hộp thoại.
- Lỗi từ máy chủ hiện ngay trong hộp thoại, không đóng. Trường cần nhập thêm (mật khẩu khi xoá tài khoản) đặt trong hộp thoại.
- Ở 360 px hai nút xếp dọc, nút xác nhận ở trên; từ 640 px xếp ngang, nút xác nhận bên phải.
- Dòng thẻ trống mới thêm được xoá ngay, không hỏi.
- Rời trang tạo, sửa bộ từ hoặc nhập từ file khi còn dữ liệu chưa lưu dùng `useUnsavedGuard` (`components/common/use-unsaved-guard.tsx`): link và nút quay lại trong app hiện hộp thoại "Rời trang khi chưa lưu?" với "Ở lại" và "Rời trang"; đóng tab hoặc tải lại dùng hộp thoại mặc định của trình duyệt qua `beforeunload`. Không dùng `window.confirm`.

## Hộp thoại form

Form ngắn (khoảng dưới 6 trường: tạo, sửa lớp, tham gia lớp, thư mục, đổi tên, đổi mật khẩu, khoá tài khoản, ẩn bộ từ, giao bài) mở trong `FormDialog` (`components/common/form-dialog.tsx`). Không chèn form vào giữa trang vì đẩy nội dung xuống và làm vỡ bố cục, không mở trang riêng cho form ngắn. Ngoại lệ: trình soạn dài như tạo, sửa bộ từ và nhập từ file giữ trang riêng.

- `FormDialog` và `ConfirmDialog` dùng chung khung `Dialog` trong `components/ui/dialog.tsx`: thẻ `dialog` gốc với `showModal()`, render qua portal ra `body`, Esc và bấm nền `overlay` xin đóng, đóng xong focus về nút đã mở.
- Bố cục: đầu có tiêu đề `text-h3`, mô tả `text-small` `text-muted` và nút đóng biểu tượng 44 px (`aria-label="Đóng"`), ngăn với thân bằng viền `border`; thân cuộn riêng (`overscroll-contain`); chân có lỗi máy chủ (`FormError`) rồi hai nút Huỷ (`secondary`) và nút gửi (`primary`, vòng quay khi đang gửi).
- Từ 640 px: rộng tối đa 512 px, cao tối đa `min(40rem, 100dvh - 4rem)`, bo `lg`. Dưới 640 px: chiếm toàn màn hình, không bo góc, chân luôn ở đáy; hai nút xếp dọc, nút gửi ở trên.
- Mở thì focus ô nhập đầu tiên (hoặc phần tử có `data-autofocus`). Đang gửi thì không đóng được.
- Đã nhập (`dirty`) mà đóng bằng Esc, nền, nút đóng hoặc Huỷ thì hỏi "Bỏ nội dung đang nhập?" với "Nhập tiếp" và "Bỏ nội dung". Chưa nhập thì đóng ngay.
- Gửi form trong hộp thoại dừng lan sự kiện để không gửi form của trang bên dưới.

## Trang Tài khoản

Hai cột từ 1024 px: cột trái 280 px là thẻ hồ sơ dính khi cuộn (chữ cái đầu trong vòng tròn 64 px nền `primary`, tên `text-h3`, email `text-muted`, nhãn vai trò); cột phải là các nhóm dạng thẻ (viền `border`, nền `surface`, bo `lg`): Hồ sơ, Bảo mật, Giọng đọc và Xoá tài khoản (viền `danger-mark`, tiêu đề `danger`). Mỗi nhóm gồm các dòng "nhãn, giá trị, nút" ngăn bằng viền. Sửa tên và đổi mật khẩu mở `FormDialog`; tài khoản Google ghi "Đăng nhập bằng Google" thay cho mật khẩu. Dưới 1024 px xếp một cột. Quản lý người dùng chỉ nằm trong menu tài khoản.

## Lộ trình "Bắt đầu học"

Nút chính "Bắt đầu học" trên trang bộ từ mở `/sets/:id/study/path`, chạy lần lượt Xem thẻ → Trắc nghiệm → Ghép cặp → Luyện viết (`PATH_STEPS` trong `features/study/path-steps.ts`). Dòng mô tả dưới tiêu đề "Chọn cách học" nói rõ thứ tự này. Trong phiên, dưới thanh tiến độ có hàng chip các bước: bước đã xong viền và nền `primary-soft` kèm dấu tích, bước đang học nền `primary` chữ `primary-fg` (`aria-current="step"`), bước sau viền `border` chữ `text-muted`. Màn kết quả mỗi bước có nút chính "Bước tiếp: <tên bước>"; bước cuối có hộp viền `primary` chúc mừng đã đi hết lộ trình. Bước không dùng được với bộ từ thì tự bỏ qua. Flashcard là một ô trong lưới chế độ như các chế độ khác.

## Phản hồi khi học

Đúng dùng lớp `feedback-correct` (nảy nhẹ 200 ms), sai dùng `feedback-wrong` (rung ngang 240 ms), định nghĩa trong `globals.css` và tắt khi `prefers-reduced-motion`. Chuyển động chỉ đi kèm icon và chữ, không thay chúng.

## Nút micro khi luyện nói

Nút tròn 64 px viền 2 px `primary`. Chờ nói: nền `primary-soft`, icon micro màu `primary`, tên "Bấm để nói" (hoặc "Thử lại"), chú thích dưới nút "Bấm micro rồi đọc to từ" màu `text-muted`. Đang nghe: nền `primary`, icon vuông dừng màu `primary-fg`, tên "Dừng nghe", lớp `mic-listening` toả vòng `primary` 1,2 giây lặp lại; chú thích đổi thành icon micro kèm "Đang nghe… hãy đọc to từ" màu `primary` trong vùng `role="status"`. Giảm chuyển động thì không toả, thay bằng viền ngoài 4 px `primary-soft` đứng yên. Chỉ có một nút đổi vai trò nên focus bàn phím không mất; bấm Dừng hoặc rời câu thì huỷ lần nghe, không báo lỗi.
