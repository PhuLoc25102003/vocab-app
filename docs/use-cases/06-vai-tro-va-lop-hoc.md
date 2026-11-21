# Use case: giai đoạn 5, vai trò, lớp học và độ gọn của giao diện

Phân tích từ góp ý ngày 2026-11-20 sau khi dùng thử bằng tài khoản ADMIN và TEACHER. Các việc tương ứng nằm ở Giai đoạn 5 trong `docs/07-progress.md`. Thiết kế theo skill `ui-ux-pro` và `docs/05-ui-tokens.md`.

## 1. Vấn đề đã ghi nhận

| Mã     | Vấn đề                                                                                                                                                                                                                                                                              | Bằng chứng  | Mức  | Việc           |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---- | -------------- |
| GAP-14 | Đăng xuất rồi đăng nhập lại, mục menu vẫn ghi "Đang đăng xuất" và bị khoá, phải F5                                                                                                                                                                                                  | Đã tái hiện | Cao  | 5.1            |
| GAP-15 | Luyện nói: bấm "Bấm để nói" thì nút chỉ quay vòng, không có dấu hiệu micro đang nghe                                                                                                                                                                                                | Đã tái hiện | Vừa  | 5.2            |
| GAP-16 | Tổng quan của giáo viên giống hệt học sinh, không có số liệu lớp; tổng quan ADMIN chỉ có 4 con số                                                                                                                                                                                   | Đã tái hiện | Cao  | 5.18 đến 5.22  |
| GAP-17 | Giao bài chỉ được một chế độ; học sinh học xong bị đưa về trang bộ từ, không có nút nộp bài                                                                                                                                                                                         | Đã tái hiện | Cao  | 5.10 đến 5.14  |
| GAP-18 | Chỉ giao được bộ Công khai, trong khi bộ công khai học sinh đã tự tìm được ở Khám phá; schema có `CLASS` nhưng form chặn                                                                                                                                                            | Đọc code    | Cao  | 5.11, 5.13     |
| GAP-19 | Giáo viên không có số liệu từng học sinh: đúng hạn, trễ, bỏ lỡ                                                                                                                                                                                                                      | Đã tái hiện | Cao  | 5.15, 5.16c    |
| GAP-20 | Danh sách lớp nhạt, các hàng không tách bạch; trang lớp có khối mã lớp chiếm gần nửa màn hình đầu                                                                                                                                                                                   | Đã tái hiện | Vừa  | 5.16a, 5.16b   |
| GAP-21 | Form tạo lớp, giao bài, thư mục, khoá tài khoản, ẩn bộ hiện ngay trong trang, đẩy nội dung xuống và làm vỡ bố cục                                                                                                                                                                   | Đã tái hiện | Vừa  | 5.3, 5.8, 5.13 |
| GAP-22 | Ô hạn nộp là `datetime-local` mặc định: `mm/dd/yyyy`, AM/PM, màu xanh của trình duyệt, không theo token                                                                                                                                                                             | Đã tái hiện | Vừa  | 5.4            |
| GAP-23 | Trang Tài khoản lệch trái, ô nhập hẹp, các mục xếp một cột dài, nhiều nút viền giống nhau                                                                                                                                                                                           | Đã tái hiện | Vừa  | 5.9            |
| GAP-24 | Thẻ bộ từ cao tối thiểu 160 px, màn hình rộng chỉ thấy 6 bộ                                                                                                                                                                                                                         | Đã tái hiện | Thấp | 5.6            |
| GAP-25 | Tên hoặc mô tả dài không có dấu cách tràn khỏi thẻ và hàng                                                                                                                                                                                                                          | Đọc code    | Vừa  | 5.5            |
| GAP-26 | Một số danh sách tải hết một lần (bài đã giao, bài cần làm, lớp đã tham gia, kết quả của học sinh, thẻ trong trang bộ từ)                                                                                                                                                           | Đọc code    | Vừa  | 5.7            |
| GAP-27 | Modal giao bài có thêm một ô "Tìm bộ từ" tách khỏi ô chọn bộ; ô chọn ngôn ngữ dài không tìm được                                                                                                                                                                                    | Đã tái hiện | Vừa  | 5.25           |
| GAP-29 | Giao bài chỉ chọn được tối đa 5 chế độ; Ôn hôm nay chỉ ôn bằng một chế độ mỗi lần                                                                                                                                                                                                   | Góp ý       | Vừa  | 5.27, 5.28     |
| GAP-31 | Danh sách (bài cần làm, lớp đã tham gia, bài đã giao, học sinh, lớp đang dạy) không có khung, khó tách khỏi phần khác                                                                                                                                                               | Góp ý       | Vừa  | 5.29           |
| GAP-32 | Bài cần làm và bài đã giao không lọc, không tìm được; nhiều bài thì khó tìm lại bài đã làm; hai bên khác style                                                                                                                                                                      | Góp ý       | Cao  | 5.30 đến 5.32  |
| GAP-33 | Danh sách lớp của giáo viên không tìm, không sắp xếp; ô tìm ở tab Học sinh co thành ô vuông, ô sắp xếp giãn hết hàng                                                                                                                                                                | Đã tái hiện | Vừa  | 5.29, 5.33     |
| GAP-34 | Thư mục trên mobile là hàng chip cuộn ngang bị cắt chữ; kéo thả bộ vào thư mục không dùng được trên màn hình cảm ứng                                                                                                                                                                | Đã tái hiện | Cao  | 5.34           |
| GAP-28 | Modal hẹp (512 px); ở 360 px form chỉ một ô vẫn chiếm cả màn hình, cao hơn nhiều so với nội dung                                                                                                                                                                                    | Đã tái hiện | Vừa  | 5.26           |
| GAP-35 | Lỗi hiển thị trên mobile 360 px: nhãn Bottom Nav rớt 2 dòng ("Review today"), thanh tìm kiếm & sắp xếp trang Bộ từ dồn ép làm cụt ô tìm kiếm và lệch nhãn Sort, dropdown ListToolbar ở Quản lý người dùng bẻ đôi chữ làm lệch chiều cao hàng, tay nắm kéo thả vẫn hiện trên cảm ứng | Đã tái hiện | Vừa  | 5.36           |

Nguyên nhân GAP-14: `AccountMenu` giữ state `leaving` sau khi bấm Đăng xuất và không đặt lại. Header của app không bị huỷ khi chuyển trang (Next 16 giữ cây component của route cũ), nên lần đăng nhập sau vẫn thấy state cũ. Sửa bằng cách đặt lại `leaving` khi người dùng trong store đổi, hoặc gắn `key` theo `user.id`.

## 2. Nghiệp vụ theo vai trò

### Ai dùng và cần gì

| Vai trò   | Bối cảnh                                                      | Việc chính khi mở app                               | Đo thành công                                    |
| --------- | ------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------ |
| Học sinh  | Điện thoại, 10 đến 15 phút mỗi ngày, có thể thuộc 1 đến 3 lớp | Làm bài được giao trước hạn, rồi ôn thẻ đến hạn     | Không bỏ lỡ bài, giữ streak                      |
| Giáo viên | Máy tính ở nhà hoặc trường, 2 đến 6 lớp, mỗi lớp 30 đến 45 em | Biết lớp nào, em nào cần nhắc; giao bài mới         | Tỉ lệ nộp đúng hạn của lớp, phát hiện em tụt lại |
| ADMIN     | Máy tính, vài lần mỗi tuần                                    | Biết hệ thống có tăng trưởng không, có gì cần xử lý | Xử lý hết tài khoản, nội dung vi phạm            |

Giáo viên và ADMIN vẫn học được như học sinh. Phần học cá nhân của họ không bị bỏ, chỉ đưa xuống dưới hoặc thu gọn.

### Vì sao cần giao bài khi đã có Khám phá

Khám phá là tự học, không ai theo dõi. Giao bài là một yêu cầu có:

- **Hạn nộp** và trạng thái đúng hạn, trễ, bỏ lỡ.
- **Chế độ bắt buộc**: giáo viên chọn kỹ năng cần luyện, không để học sinh chỉ lật thẻ.
- **Bài nộp và điểm** để giáo viên xem theo lớp và theo từng em.
- **Nội dung riêng của lớp**: bộ không công khai ra Khám phá.

Vì vậy bộ từ giao cho lớp **không cần công khai**. Quy tắc mới thay cho việc chặn bộ riêng tư:

- Bộ Công khai: giao bình thường, phạm vi giữ nguyên.
- Bộ Riêng tư: modal giao bài báo "Bộ này đang Riêng tư. Khi giao, học sinh của lớp sẽ xem được bộ này, người ngoài lớp vẫn không thấy." Giáo viên xác nhận thì API đổi bộ sang `CLASS` trong cùng transaction với bài giao.
- Bộ `CLASS` chỉ giáo viên và thành viên các lớp được giao bộ xem được (quy tắc đã có từ 3.4), không hiện ở Khám phá.
- Chỉ giao được bộ của chính mình. Muốn giao bộ của người khác thì sao chép về trước (đã có).

### Bài giao nhiều chế độ

- Giáo viên chọn từ 1 chế độ đến tất cả chế độ dùng được với bộ, theo thứ tự, có nút "Chọn tất cả" và "Bỏ chọn" (5.27; trước đây giới hạn 5). Mặc định là lộ trình đề xuất giống "Bắt đầu học": Xem thẻ, Trắc nghiệm, Ghép cặp, Luyện viết. Giáo viên kéo hoặc dùng nút lên, xuống để đổi thứ tự.
- Luyện nói được chọn nhưng có cảnh báo "Cần micro và trình duyệt hỗ trợ. Học sinh không nói được có thể bỏ qua từng câu."
- Chế độ không dùng được với bộ (ví dụ Ghép cặp cần ít nhất 2 thẻ) thì không chọn được, có lý do.
- Bài giao cũ có một chế độ được chuyển thành danh sách một phần tử (`modes = [mode]`).

### Làm bài và nộp bài

Trạng thái của một học sinh với một bài:

| Trạng thái | Điều kiện                                          | Màu, icon               |
| ---------- | -------------------------------------------------- | ----------------------- |
| Chưa làm   | Chưa xong chế độ nào                               | `text-muted`, vòng tròn |
| Đang làm   | Xong ít nhất một chế độ, chưa nộp                  | `primary`, nửa vòng     |
| Đã nộp     | Nộp trước hoặc đúng `dueAt`, hoặc bài không có hạn | `success`, dấu tích     |
| Nộp trễ    | Nộp sau `dueAt`                                    | `warning`, đồng hồ      |
| Bỏ lỡ      | Quá `dueAt`, chưa nộp                              | `danger`, dấu chấm than |

- Một chế độ được tính là xong khi có một phiên học chế độ đó gắn với bài (`StudySession.assignmentId`) đã kết thúc.
- Nút **Nộp bài** bật khi mọi chế độ đã xong. Nộp một lần, không rút lại. Sau khi nộp, học sinh vẫn học lại được để luyện, nhưng điểm không đổi.
- Điểm bài = trung bình phần trăm đúng của các chế độ có chấm điểm, lấy phiên tốt nhất của từng chế độ trước lúc nộp. Xem thẻ (Flashcard) chỉ tính hoàn thành, không vào điểm. Điểm được chốt vào bài nộp.
- Quá hạn vẫn nộp được và bị đánh dấu Nộp trễ. Bỏ lỡ chuyển thành Nộp trễ khi em nộp.
- Học sinh vào lớp sau `dueAt` của một bài thì bài đó không tính cho em. Vào lớp trước hạn thì vẫn phải làm với hạn cũ.
- Học sinh rời lớp thì không còn trong số liệu, bài nộp vẫn giữ trong database cho đến khi xoá tài khoản.
- Dữ liệu cũ: bài một chế độ mà học sinh đã có phiên xong sau khi giao thì migration tạo bài nộp tại thời điểm phiên xong đầu tiên, điểm là phiên tốt nhất.

Luồng của học sinh:

```text
Tổng quan / Lớp học
  └─ "Bài cần làm": Unit 1 · Hạn 21/11 23:59 · 2/4 chế độ
       └─ Trang bài tập /classes/assignments/:id
            ├─ Danh sách chế độ: ✓ Xem thẻ  ✓ Trắc nghiệm  ○ Ghép cặp  ○ Luyện viết
            ├─ Nút chính "Tiếp tục: Ghép cặp"
            │    └─ Phiên học /sets/:setId/study/match?assignment=:id
            │         └─ Màn kết quả: nút chính "Về bài tập" hoặc "Chế độ tiếp: Luyện viết"
            └─ Xong cả 4 → nút chính "Nộp bài" → hộp xác nhận → "Đã nộp lúc 20/11 21:05 · 86%"
```

Nút quay lại của trình duyệt ở phiên học về trang bài tập. Rời phiên giữa chừng thì phiên dở được giữ như hiện nay (1.39).

### Theo dõi học sinh

Bấm một học sinh trong trang lớp mở **modal hồ sơ học sinh** thay vì chuyển trang:

```text
┌ Phú Lộc Đặng ───────────────────────────── ✕ ┐
│ Vào lớp 20/11/2026 · Hoạt động gần nhất: hôm nay │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│ │ 8/10   │ │ 1      │ │ 1      │ │ 82%    │    │
│ │Đúng hạn│ │Nộp trễ │ │Bỏ lỡ   │ │Điểm TB │    │
│ └────────┘ └────────┘ └────────┘ └────────┘    │
│ Bài gần đây                                   │
│ Unit 3   Hạn 25/11   ⏱ Nộp trễ   74%          │
│ Unit 2   Hạn 18/11   ✓ Đã nộp    90%          │
│ ...5 bài                                       │
│ [Xem tất cả bài]              [Xoá khỏi lớp]  │
└───────────────────────────────────────────────┘
```

- Mẫu số chỉ gồm bài có hạn đã qua hoặc đã nộp, tính từ ngày vào lớp. Bài chưa tới hạn và chưa nộp ghi riêng "đang chờ".
- "Xem tất cả bài" mở trang `/classes/:id/members/:userId` hiện có, có phân trang.
- Không hiện email của học sinh cho giáo viên, chỉ tên hiển thị.

## 3. Tổng quan theo vai trò

Một route `/dashboard`, nội dung chọn theo vai trò. Mỗi màn có một nút chính.

### Học sinh

```text
Tổng quan
┌ Bài tập lớp ──────────────────────────────────────────────┐
│ ! Unit 3 · Lớp Fa1 · Quá hạn 1 ngày           [Làm bài]  │
│ ○ Unit 4 · Lớp Fa1 · Hạn mai 23:59 · 1/4 chế độ [Tiếp tục]│
│ Xem tất cả bài tập →                                      │
└───────────────────────────────────────────────────────────┘
[Việc nên làm tiếp]  [4 ô số liệu]  [Hoạt động 7 ngày]  [Bộ từ gần đây]
```

- Khối "Bài tập lớp" chỉ hiện khi đã vào lớp, tối đa 3 bài: Bỏ lỡ, rồi hạn gần nhất. Không có bài thì ẩn, không hiện khối trống.
- Phần còn lại giữ như 2.21.

### Giáo viên

Câu hỏi cần trả lời trong 5 giây: "Lớp nào, bài nào, em nào cần tôi nhắc?"

```text
Tổng quan                                      [+ Giao bài]
┌──────────┐┌──────────┐┌──────────┐┌──────────────────┐
│ 4 lớp    ││ 132 HS   ││ 6 bài mở ││ 78% nộp đúng hạn │
│          ││ +5 tuần  ││ 2 hạn 48h││ 30 ngày, ▲ 4%    │
└──────────┘└──────────┘└──────────┘└──────────────────┘
┌ Cần chú ý ──────────────────┐┌ Sắp đến hạn ──────────────┐
│ Unit 3 · Fa1 · còn 20 giờ   ││ Unit 3 · Fa1  ▓▓▓░░ 18/32 │
│   mới nộp 12/32             ││ Unit 4 · Fa2  ▓░░░░  4/30 │
│ 3 HS bỏ lỡ ≥ 2 bài liền     ││ ...                       │
│   Lan, Minh, Huy  [Xem]     ││                           │
└─────────────────────────────┘└───────────────────────────┘
┌ Bài vừa nộp ──────────────────────────────────────────────┐
│ Lan · Unit 3 · 92% · 10 phút trước   ...10 dòng           │
└───────────────────────────────────────────────────────────┘
▸ Việc học của tôi (thu gọn, mở ra là phần của học sinh)
```

- **Cần chú ý**: bài còn dưới 48 giờ mà dưới 50% lớp đã nộp; học sinh bỏ lỡ từ 2 bài liên tiếp trong 30 ngày. Không có gì thì ghi "Lớp đang ổn" kèm icon, không để trống.
- **Sắp đến hạn**: bài chưa hết hạn, sắp theo hạn, thanh tiến độ nộp kèm số (không dựa vào màu). Bấm mở trang kết quả bài.
- **Bài vừa nộp**: 10 bài nộp mới nhất của mọi lớp, bấm tên mở modal hồ sơ học sinh.
- Nút chính "Giao bài" mở modal giao bài có thêm ô chọn lớp. Chưa có lớp thì nút chính là "Tạo lớp" và thân trang là trạng thái trống hướng dẫn 3 bước: tạo lớp, gửi mã, giao bài.

### ADMIN

Câu hỏi: "Hệ thống có tăng trưởng không, có gì cần xử lý?"

```text
Tổng quan                                   [Quản lý người dùng]
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
│ 1.204 người  ││ 312 hoạt động││ 860 bộ từ    ││ 2.410 phiên  │
│ +48 tuần này ││ 7 ngày       ││ 214 công khai││ học 7 ngày   │
└──────────────┘└──────────────┘└──────────────┘└──────────────┘
┌ Đăng ký mới và người hoạt động, 30 ngày (cột + đường) ─────┐
└────────────────────────────────────────────────────────────┘
┌ Cần xử lý ──────────────────┐┌ Vai trò ───────────────────┐
│ 3 tài khoản đang khoá  [Xem]││ Học sinh 1.150 ▓▓▓▓▓▓▓▓▓  │
│ 2 bộ đang ẩn           [Xem]││ Giáo viên   50 ▓           │
│ 14 bộ công khai mới    [Rà] ││ ADMIN        4             │
└─────────────────────────────┘└────────────────────────────┘
┌ Người dùng mới (5) · Bộ công khai mới (5, có nút Ẩn) ──────┐
```

- "Hoạt động" là người có ít nhất một phiên học trong 7 ngày.
- "Bộ công khai mới" là hàng chờ rà nội dung trong 7 ngày, mỗi dòng có nút Ẩn (modal lý do đã có ở 2.15).
- Biểu đồ theo skill `dataviz`, màu từ token, có bảng số ẩn cho trình đọc màn hình.
- Phần học cá nhân của ADMIN thu gọn như giáo viên.

## 4. Lớp học trên web

### Danh sách lớp `/classes` (giáo viên)

Mỗi lớp là một thẻ hàng có viền `border-strong`, nền `surface`, hover viền `primary`:

```text
┌──────────────────────────────────────────────────────────────┐
│ (F) Fa1                         32 HS · 2 bài mở · YQMZ4L ⧉ │
│     Tiếng Anh 10A1              ▓▓▓▓▓▓░░ 78% nộp đúng hạn  ›│
└──────────────────────────────────────────────────────────────┘
```

- Ô chữ cái đầu của lớp, tên đậm, mô tả 1 dòng cắt bằng dấu ba chấm, số học sinh, số bài đang mở, tỉ lệ nộp đúng hạn 30 ngày, mã lớp kèm nút sao chép.
- Phân trang 20 lớp, ô tìm theo tên khi hơn 6 lớp. "Tạo lớp" mở modal.

### Trang lớp `/classes/:id`

```text
‹ Lớp học
Fa1                                       [Giao bài]  [⋯]
Tiếng Anh 10A1 · 32 học sinh · Mã YQMZ4L ⧉  [Mời học sinh]
[ Bài tập (6) ]  [ Học sinh (32) ]
```

- Mã lớp thành chip nhỏ trên dòng thông tin, có nút sao chép. "Mời học sinh" mở modal có mã lớn để chiếu lên bảng, nút sao chép, nút đổi mã (hỏi lại). Khối mã lớn cũ bị bỏ.
- Menu "⋯": Sửa tên và mô tả (modal), Đổi mã, Lưu trữ lớp.
- Tab nằm trong URL (`?tab=students`) để nút quay lại đúng.
- **Tab Bài tập**: bảng có cột Bộ từ, Chế độ (chip, quá 2 thì "+2"), Hạn, Đã nộp x/y kèm thanh, nút xoá. Bấm hàng mở trang kết quả bài. Phân trang 20. Lọc Đang mở, Đã hết hạn.
- **Tab Học sinh**: bảng có Tên, Vào lớp, Đúng hạn, Trễ, Bỏ lỡ, Điểm TB. Sắp xếp theo cột, mặc định Bỏ lỡ giảm dần để em cần nhắc lên đầu. Ô tìm theo tên. Phân trang 20. Bấm hàng mở modal hồ sơ học sinh. Ở 360 px bảng thành danh sách thẻ, mỗi thẻ 2 dòng.

### Modal giao bài

```text
┌ Giao bài cho Fa1 ─────────────────────────────── ✕ ┐
│ Bộ từ       [ Tìm bộ của bạn…              ▾ ]      │
│             ⓘ Bộ đang Riêng tư. Học sinh lớp sẽ xem │
│               được, người ngoài lớp vẫn không thấy. │
│ Chế độ      [✓ Xem thẻ ↑↓] [✓ Trắc nghiệm ↑↓]       │
│             [✓ Ghép cặp ↑↓] [✓ Luyện viết ↑↓]       │
│             [ ] Điền từ [ ] Nghe viết [ ] Luyện nói │
│ Hạn nộp     [ 21/11/2026 ] [ 23:59 ]                │
│             (Hết hôm nay) (Ngày mai) (1 tuần)       │
│                                  [Huỷ] [Giao bài]   │
└─────────────────────────────────────────────────────┘
```

- Ô chọn bộ là `Combobox`: gõ để lọc ngay trong ô, không có ô tìm kiếm riêng; mỗi mục hiện số thẻ và phạm vi. Hạn nộp tuỳ chọn, phải sau hiện tại.
- Modal cỡ `lg`. Ở 360 px modal cao theo nội dung, nút dính ở đáy khi form dài hơn màn hình.

## 5a. Danh sách lớn (góp ý ngày 2026-11-21)

Người dùng: học sinh dùng điện thoại, giáo viên dùng máy tính. Việc chính: tìm lại đúng bài hoặc lớp khi danh sách có hàng trăm mục. Mọi danh sách dùng chung một khung và một hàng công cụ.

### Khung danh sách `ListPanel`

```text
┌ Bài tập · 128 ─────────────────────────────────────────────┐
│ [ Cần làm (6) ][ Đã nộp (120) ][ Tất cả ]                  │
│ [🔍 Tìm theo tên bộ        ] [Lớp: Tất cả ▾] [Hạn gần nhất ▾]│
├────────────────────────────────────────────────────────────┤
│ ! Unit 3 · Fa1 · Quá hạn 1 ngày · 2/4 chế độ     [Làm bài]  │
│ ○ Unit 4 · Fa2 · Hạn mai 23:59                  [Làm bài]  │
├────────────────────────────────────────────────────────────┤
│ 1–20 trên 128                          ‹ Trang 1/7 ›        │
└────────────────────────────────────────────────────────────┘
```

- Khung: viền `border-strong`, nền `surface`, bo `lg`. Đầu khung: tiêu đề `text-h3` kèm tổng số, nút hành động bên phải. Hàng công cụ: tab trạng thái (link trong URL), ô tìm co giãn chiếm phần còn lại, các ô lọc và sắp xếp cỡ cố định; ở 360 px ô tìm một hàng, lọc và sắp xếp chung hàng dưới. Thân: các hàng ngăn bằng viền. Chân: "1–20 trên 128" và `Pagination`.
- Bốn trạng thái nằm trong khung. Đang lọc mà không có kết quả: "Không có bài nào khớp" kèm nút "Xoá bộ lọc".
- Mọi bộ lọc, ô tìm và trang nằm trong URL. Ô tìm gửi khi bấm Enter hoặc sau 300 ms ngừng gõ.

### Bài tập: một kiểu hàng cho cả học sinh và giáo viên

`AssignmentRow` dùng chung: icon trạng thái (5 loại theo bài nộp ở bên học sinh; Đang mở, Đã hết hạn ở bên giáo viên), tên bộ, lớp, hạn dạng tương đối, chip chế độ (quá 2 thì "+2"), cột phải là thanh tiến độ (học sinh: x/y chế độ; giáo viên: đã nộp x/y học sinh) và nút hoặc mũi tên.

- **Học sinh** `/classes`: tab Cần làm (chưa làm, đang làm, bỏ lỡ), Đã nộp (đã nộp, nộp trễ), Tất cả; lọc lớp; tìm theo tên bộ; sắp hạn gần nhất hoặc mới giao. Mặc định Cần làm.
- **Giáo viên** tab Bài tập: tab Đang mở, Đã hết hạn, Tất cả; tìm theo tên bộ; sắp hạn gần nhất hoặc mới giao. Mặc định Đang mở.
- "Lớp đã tham gia" là khung riêng có tìm theo tên lớp và phân trang.

### Lớp đang dạy

Khung danh sách với tab Đang dạy, Đã lưu trữ, ô tìm theo tên lớp, sắp xếp (mới tạo, tên A đến Z, nhiều học sinh), phân trang 20. Hàng lớp giữ thiết kế 5.16a.

### Thư mục trên mobile

```text
Bộ từ                                   [Nhập] [+ Tạo]
[📁 Lớp 6 (3) ▾]  [🔍 Tìm bộ từ      ] [⇅]
┌ Unit 5 ─────────────────────── ⋯ ┐
│ Riêng tư · 1 thẻ · 21/11/2026    │
└──────────────────────────────────┘
```

- Dưới 1024 px bỏ hàng chip cuộn ngang. Nút "Thư mục: <tên> ▾" mở tấm đáy liệt kê Tất cả bộ từ, Chưa xếp thư mục và các thư mục (số bộ), có ô tìm khi nhiều hơn 8 thư mục và nút "Thư mục mới". Chọn xong tấm đáy đóng và danh sách lọc theo thư mục.
- Chuyển bộ vào thư mục bằng menu "⋯" của thẻ, chọn "Chuyển vào thư mục" rồi chọn trong tấm đáy. Bỏ tay nắm kéo thả trên màn hình cảm ứng (`pointer: coarse`); máy tính vẫn kéo thả được như 2.30.
- Ô tìm và nút sắp xếp chung một hàng; sắp xếp là nút icon mở menu. Vùng bấm tối thiểu 44 px.

## 5. Quy tắc giao diện toàn site

Đưa vào `docs/05-ui-tokens.md` khi làm việc tương ứng.

**Form trong modal (5.3, 5.8).** Form ngắn (dưới khoảng 6 trường) mở trong `FormDialog`, không chèn vào trang và không mở trang riêng. Ngoại lệ là trình soạn dài: tạo, sửa bộ từ và nhập từ file giữ trang riêng vì cần nhiều chỗ và có cảnh báo chưa lưu. `FormDialog` dùng chung nền với `ConfirmDialog`: `dialog` gốc, khoá focus, Esc đóng (hỏi lại nếu đã nhập), focus vào ô đầu tiên, lỗi máy chủ hiện trong modal, nút gửi có vòng quay. Kích thước theo mục "Kích thước modal" (5.26).

**Ô chọn có tìm kiếm (5.25).** Ô chọn nào có thể quá 8 lựa chọn (bộ từ, lớp, ngôn ngữ) dùng `Combobox` dùng chung (`components/common/combobox.tsx`): ô nhập là chính ô chọn, gõ để lọc không phân biệt dấu và hoa thường, danh sách thả xuống tối đa khoảng 6 mục rồi cuộn, phím lên xuống để chọn, Enter chọn, Esc đóng và giữ giá trị cũ, không có kết quả thì ghi "Không có kết quả". Theo mẫu ARIA combobox (`role="combobox"`, `aria-expanded`, `aria-activedescendant`, `role="listbox"`). Không thêm một ô "Tìm…" riêng cạnh ô chọn. Ô chọn ngắn, cố định (giọng đọc, tốc độ, dấu phân cách, cột) giữ `Select`.

**Kích thước modal (5.26).** `FormDialog` có cỡ `md` (mặc định, 560 px) và `lg` (720 px, cho form nhiều cột hoặc danh sách như giao bài). Chiều cao luôn theo nội dung, tối đa `100dvh - 4rem`, phần thân cuộn khi dài hơn. Ở 360 px modal là tấm đáy (bottom sheet) rộng hết màn hình, bo hai góc trên, cao theo nội dung; chỉ chạm đỉnh màn hình khi form thật sự dài. Không đặt chiều cao cố định.

**Phân trang (5.7).** Danh sách có thể dài hơn 20 mục thì phân trang bằng `Pagination`, số trang trong URL (`?page=`). Không tải hết rồi cuộn. Ngoại lệ: danh sách thẻ trong trình soạn bộ từ (đã có khung cuộn riêng ở 2.32). Danh sách thẻ trên trang bộ từ phân trang 50 thẻ. Mọi endpoint danh sách giữ `limit` tối đa 100.

**Chống tràn chữ (5.5).** Mọi phần tử con co giãn trong flex hoặc grid có `min-w-0`. Tên và mô tả dùng `break-words` và cắt dòng: tên bộ 2 dòng, mô tả 1 đến 2 dòng, tên trong hàng bảng 1 dòng kèm `title` để xem đủ. Test bằng chuỗi 120 ký tự không dấu cách ở 360 px.

**Mật độ thẻ bộ từ (5.6).** Thẻ cao tối thiểu khoảng 112 px, padding 12 px, tên `text-body` đậm tối đa 2 dòng, mô tả 1 dòng, số thẻ và ngày cập nhật chung một hàng. Lưới 1 cột ở 360 px, 2 cột từ 640 px, 3 cột từ 1024 px, 4 cột từ 1280 px. Vùng bấm vẫn tối thiểu 44 px.

**Ngày giờ (5.4).** `DateTimeField` hiện `dd/mm/yyyy` và giờ 24 tiếng, màu theo token, có nút nhanh. Gửi ISO như hiện nay, hiện theo giờ máy.

**Trang Tài khoản (5.9).**

```text
Tài khoản
┌ (A) Admin ───────────────┐  ┌ Hồ sơ ─────────────────────────────┐
│ admin@vocab.local        │  │ Tên hiển thị   Admin        [Sửa]  │
│ Quản trị viên            │  │ Email          admin@vocab.local   │
│ Tham gia 20/11/2026      │  └────────────────────────────────────┘
└──────────────────────────┘  ┌ Bảo mật ───────────────────────────┐
                              │ Mật khẩu   ••••••••    [Đổi]       │
                              │ Phiên      Mọi thiết bị [Đăng xuất]│
                              └────────────────────────────────────┘
                              ┌ Giọng đọc ─────────────────────────┐
                              └────────────────────────────────────┘
                              ┌ Vùng nguy hiểm (viền danger) ──────┐
                              │ Xoá tài khoản              [Xoá]   │
                              └────────────────────────────────────┘
```

- Hai cột từ 1024 px: cột trái 280 px là thẻ hồ sơ dính khi cuộn; cột phải là các nhóm cài đặt dạng hàng "nhãn, giá trị, nút". Dưới 1024 px xếp một cột.
- Đổi tên và đổi mật khẩu mở modal. Tài khoản Google không có mật khẩu thì hàng Mật khẩu ghi "Đăng nhập bằng Google".
- Bỏ nút "Quản lý người dùng" ở đầu trang vì đã có trong menu tài khoản và Tổng quan của ADMIN.

**Luyện nói (5.2).** Trước khi nói: nút tròn 64 px có icon micro, chữ "Bấm để nói". Đang nghe: icon micro trong vòng tròn nền `primary` có hiệu ứng toả nhẹ (tắt khi `prefers-reduced-motion`, thay bằng viền đậm), chữ "Đang nghe… hãy đọc to từ", nút "Dừng". `aria-live="polite"` báo "Đang nghe". Hết thời gian không nghe thấy thì quay về trạng thái đầu và báo lỗi như hiện nay.

**Layout trên mobile 360 px (5.36).** Rà soát và sửa triệt để các lỗi xô lệch bố cục trên màn hình di động nhỏ:

- **Bottom navigation bar (`AppNav`)**: 5 tab chia đều trên màn hình hẹp (mỗi cột ~72 px). Nhãn tab phải luôn là 1 dòng duy nhất (`whitespace-nowrap`, `truncate`, cỡ `text-tiny`), không để từ có dấu cách rớt dòng ("Review today" hay "Ôn hôm nay" bị bẻ làm 2 dòng làm lệch icon và méo chiều cao thanh nav). Nhãn hiển thị cho mobile ưu tiên từ ngắn gọn (tiếng Anh dùng "Review", tiếng Việt dùng "Ôn tập").
- **Thanh tìm kiếm & sắp xếp trang Bộ từ (`MySets`)**: Không nhồi nhét cả ô tìm kiếm, nút tìm kiếm và ô chọn sắp xếp vào cùng một hàng ngang khi màn hình hẹp (< 640 px). Ô tìm kiếm trên mobile xếp toàn chiều rộng (`w-full`) với icon kính lúp bên trong; ô chọn sắp xếp nằm ở hàng riêng hoặc tích hợp đồng bộ theo chuẩn `ListToolbar`. Bỏ nhãn "Sort" đặt trôi nổi phía trên làm lệch baseline hàng.
- **Tay nắm kéo thả bộ từ (`FolderDndArea`)**: Ẩn tay nắm chấm dọc `:::` trên màn hình cảm ứng hoặc dưới 768 px (`hidden md:flex`), vì kéo thả không tiện dụng trên mobile và đã có menu "⋯ > Chuyển vào thư mục" (GAP-34).
- **Ô chọn trong `ListToolbar` (Quản lý người dùng, Lớp học, Bài tập)**: Khi màn hình 360 px chia 2 cột cho các ô chọn lọc (ví dụ vai trò và sắp xếp), nhãn hiển thị trong `Select` không được làm gãy dòng (ví dụ "Newest sign-ups" bị ngắt thành 2 dòng làm phình chiều cao ô bên phải). `Select` trên mobile có chiều cao cố định `min-h-11`, chữ dùng `text-small` kèm `truncate`, nhãn hiển thị trong danh sách ngắn gọn ("Mới nhất" / "Newest").
- **Khoảng cách header trang di động**: Đảm bảo padding-top của header trang ở màn hình nhỏ không bị dính sát thanh địa chỉ/tai thỏ của trình duyệt di động.

## 6. Dữ liệu và API cần thêm

Mọi thay đổi theo kiểu thêm (quy tắc 13).

| Thay đổi                                                       | Ghi chú                                                                                                    |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Assignment.modes StudyMode[]`                                 | Backfill `[mode]`. Cột `mode` giữ đến lần deploy sau rồi mới xoá                                           |
| `StudySession.assignmentId String?`                            | `onDelete: SetNull`, index `(assignmentId, userId)`                                                        |
| Bảng `AssignmentSubmission`                                    | `assignmentId`, `userId`, `submittedAt`, `score Int?`, `late Boolean`; khoá chính `(assignmentId, userId)` |
| `POST /classes/:id/assignments` nhận `modes[]`, `shareToClass` | Bộ riêng tư mà thiếu `shareToClass: true` thì trả `SET_PRIVATE_NEEDS_SHARE`                                |
| `GET /classes/assignments/:id`                                 | Học sinh xem bài: chế độ, chế độ đã xong, điểm từng chế độ, bài nộp                                        |
| `POST /classes/assignments/:id/submit`                         | Lỗi `ASSIGNMENT_INCOMPLETE`, `ASSIGNMENT_ALREADY_SUBMITTED`                                                |
| `POST /study/sessions` nhận `assignmentId`                     | Chỉ khi là thành viên lớp và chế độ thuộc bài                                                              |
| `GET /classes/:id/members` thêm số liệu, `sort`, `q`           | `onTime`, `late`, `missed`, `pending`, `avgScore`, `lastActiveAt`                                          |
| `GET /teacher/overview`                                        | Ô số liệu, cần chú ý, sắp đến hạn, bài vừa nộp                                                             |
| `GET /admin/stats` mở rộng và `GET /admin/stats/daily?days=30` | Tăng trưởng, hoạt động, vai trò, hàng chờ rà                                                               |

## 7. Cách test chung

- Unit: tính trạng thái bài (Chưa làm, Đang làm, Đã nộp, Nộp trễ, Bỏ lỡ) theo giờ Việt Nam, điểm bài, quy tắc vào lớp sau hạn.
- Integration: phân quyền mọi endpoint mới (học sinh lớp khác, giáo viên khác, ADMIN), nộp hai lần, nộp khi chưa xong, giao bộ riêng tư có và không có `shareToClass`, số liệu với lớp 45 học sinh và 30 bài.
- Component: bốn trạng thái của mọi khối dashboard, modal (focus, Esc, lỗi), bảng học sinh ở 360 px, chuỗi dài không tràn.
- E2E: giáo viên giao bài 3 chế độ từ bộ riêng tư, học sinh làm từng chế độ, về trang bài tập, nộp; giáo viên thấy bài vừa nộp ở Tổng quan và số liệu trong modal hồ sơ. Đăng xuất rồi đăng nhập lại thấy mục "Đăng xuất" bấm được.
- Thủ công: light, dark, 360 px, bàn phím, `prefers-reduced-motion`.
