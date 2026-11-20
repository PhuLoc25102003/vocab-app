# Use case: giai đoạn 2, 3 và 4

Các việc này chưa bắt đầu. Trước khi làm, viết chi tiết thêm luồng chính và ngoại lệ theo mẫu ở `README.md`.

## Giai đoạn 2: Mở rộng

### UC-X1. Hạ tầng dùng chung

- **Việc 2.1, Rate limit Redis:** bộ đếm dùng chung nhiều instance. Redis lỗi thì API vẫn chạy và ghi log. Test hai instance cùng tính một giới hạn.
- **Việc 2.2, Cache bộ công khai:** sửa, xoá, đổi phạm vi phải xoá cache. Test bộ chuyển sang riêng tư không còn đọc được từ cache.
- **Việc 2.3, Staging:** `develop` tự deploy với database và secret riêng. Test smoke trên staging trước khi phát hành.

### UC-X2. Thư mục bộ từ

- **Việc:** 2.4. **Người dùng:** người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:** tạo, đổi tên, xoá thư mục; chuyển bộ từ vào thư mục; lọc danh sách theo thư mục.
- **Ngoại lệ:** xoá thư mục không xoá bộ từ; tên trùng; không dùng được thư mục của người khác.
- **Giao diện:** khung "Quản lý thư mục" và ô lọc "Thư mục" ở trang Bộ từ (`?folder=<id>|none`), ô chọn thư mục trong thao tác của chủ bộ từ.
- **Test đã có:** `folders.integration`, `sets-folders.integration`, `folder-filter.test`, `folder-manager.test`, `my-sets.test`, E2E tạo thư mục, chuyển bộ, lọc, xoá thư mục mà bộ vẫn còn.

### UC-X3. Ảnh và âm thanh cho thẻ

- **Việc:** 2.5, 2.6. **Người dùng:** chủ bộ từ.
- **Phải có:** URL ký sẵn 5 phút, ảnh PNG, JPEG, WebP tối đa 1 MB, xem trước, xoá ảnh; âm thanh TTS được lưu lại và dùng chung cho cùng từ, cùng ngôn ngữ.
- **Ngoại lệ:** sai loại hoặc quá dung lượng; tải lên dở; dịch vụ lưu trữ lỗi thì quay về Web Speech; CSP phải cho phép domain ảnh.
- **Cách test:** integration ký URL và quyền; bộ lưu trữ giả; E2E thêm ảnh rồi thấy trong lúc học.

### UC-X4. Bốn chế độ học mới

| Việc      | Chế độ   | Phải có                                                                                                                                                                                      | Test chính                                                                                            |
| --------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 2.7, 2.13 | Learn    | Đã có. Thẻ chưa thuộc hỏi trắc nghiệm rồi gõ từ, thẻ đã thuộc chỉ gõ từ. Vòng 7 câu, câu sai hỏi lại cuối vòng tới khi đúng, điểm theo lần đầu. Lối vào "Học kỹ" ở trang bộ từ và Ôn hôm nay | `learn.test`, `study-sessions.integration`, `learn-mode.test`, E2E trả lời sai rồi học đến hết, audit |
| 2.8       | Điền từ  | Đã có. Câu ví dụ có chỗ trống, nghĩa làm gợi ý                                                                                                                                               | `cloze.test`, integration, component                                                                  |
| 2.9       | Ghép cặp | Đã có. Vòng 6 cặp, tính giờ, dùng được bằng bàn phím                                                                                                                                         | `match.test`, component, E2E, audit                                                                   |
| 2.10      | Kiểm tra | Đã có. Mỗi thẻ một câu trắc nghiệm hoặc gõ từ, phần 20 câu, không chấm trước khi nộp, cảnh báo câu bỏ trống, kết quả liệt kê câu sai                                                         | `test.test`, integration chấm ở server và nộp hai lần, `test-mode.test`, E2E, audit                   |

Mỗi chế độ dùng `StudyModeStrategy`, chạy được cho tài khoản và khách, trừ khi use case ghi khác.

### UC-X5. Quản trị

- **Việc:** 2.11, 2.14, 2.12, 2.15. **Người dùng:** ADMIN. **Trạng thái:** Đã có API và trang `/admin/users` để tìm, khoá kèm lý do, mở khoá (2.11, 2.14). Lối vào ở trang Tài khoản, chỉ hiện với ADMIN. Trang không cho khoá tài khoản quản trị nên ADMIN không tự khoá mình. Đã có ẩn và bỏ ẩn bộ từ (2.12, 2.15): ADMIN bấm "Ẩn bộ từ" ở trang bộ từ và nhập lý do, chủ bộ thấy thông báo bộ đang bị ẩn kèm lý do.
- **Phải có:** danh sách và tìm người dùng, khoá tài khoản, ẩn và bỏ ẩn nội dung vi phạm, lưu lý do và người thực hiện.
- **Ngoại lệ:** ADMIN không tự khoá mình; không nhận vai trò từ dữ liệu client; bộ bị ẩn biến mất khỏi Khám phá và trang công khai.
- **Cách test:** integration 401, 403 và thành công; E2E ẩn bộ rồi khách không xem được.
- **Test đã có:** `hide-set-button.test`, `set-detail.test` (thông báo bị ẩn), E2E ADMIN ẩn bộ rồi khách không xem được, `admin-sets.integration` (401, 403, 400, 404, ẩn rồi khách và người khác không thấy ở danh sách, chi tiết, học; chủ và ADMIN vẫn thấy; bỏ ẩn), `admin-users.test` (web), E2E ADMIN khoá rồi tài khoản không đăng nhập được, mở khoá rồi đăng nhập lại, `admin-users.integration` gồm 401, 403, tìm, tham số sai, khoá rồi bị chặn đăng nhập và mất phiên, mở khoá, tự khoá mình, không tìm thấy.

### UC-X6. Trải nghiệm và giao diện

- **Việc:** 2.16 đến 2.27. **Người dùng:** mọi người. **Trạng thái:** Đủ. Đã có 2.16 (trang form căn giữa qua `PageContainer`, E2E kiểm tra tiêu đề thẳng hàng và khối căn giữa ở 1280 px) và 2.17 (`AccountMenu` dùng Radix Dropdown Menu: chữ cái đầu và tên, tên ẩn khỏi mắt trên màn hình hẹp nhưng vẫn đọc được, menu Tài khoản, Quản lý người dùng với ADMIN, Đăng xuất; `account-menu.test`, E2E đổi tên thì header cập nhật) và 2.18 (`Select` giữ thẻ `select` gốc, bỏ giao diện mặc định, có mũi tên riêng; trình duyệt hỗ trợ `appearance: base-select` thì danh sách lựa chọn theo token) và 2.19 (`StudyModeGrid` trên trang bộ từ: nút chính "Bắt đầu học" và lưới chế độ có icon, mô tả một dòng; trang công khai của khách giữ hàng nút) và 2.20 (`GET /stats/sets/:id/cards`, `cardMastery()`, nhãn mức nhớ bằng chữ và "Ôn lại dd/MM" trên từng thẻ, khối tiến độ giải thích điều kiện đã thuộc) và 2.21 (Tổng quan có việc nên làm tiếp, bốn ô số liệu, biểu đồ cột 7 ngày một màu kèm bảng cho trình đọc màn hình, thanh mức nhớ có chú thích bằng chữ và phần trăm) và 2.22 (Khám phá dùng lưới `SetCards` có tác giả, mô tả, số thẻ; Bộ từ giữ danh sách dòng kẻ; mô tả hai trang nói rõ thư viện của tôi và cộng đồng) và 2.23 (mục Giọng đọc ở trang Tài khoản chọn Anh Mỹ hoặc Anh Anh, tốc độ bình thường hoặc chậm, lưu trong `localStorage`, có nghe thử và báo khi máy không có đúng giọng; nút Nghe chậm ở Flashcard và Nghe viết; `speech.test`) và 2.24 (phản hồi đúng nảy nhẹ, sai rung ngang 200 đến 240 ms, tắt khi giảm chuyển động; màn kết quả có phần trăm, thanh `meter`, lời khích lệ theo điểm; `study-result.test`) và 2.25 (trang giới thiệu: chồng flashcard bay nhẹ, chip nổi bật, lưới 9 chế độ có icon, dòng thời gian lịch ôn, ba bước số lớn, dải kêu gọi nền bảng đen; hiện dần khi cuộn bằng CSS `animation-timeline: view()`, không thêm JavaScript, tắt khi giảm chuyển động) và 2.26 (Ôn hôm nay có khối "Khi nào thẻ đến hạn ôn?", khi trống báo thẻ tiếp theo đến hạn lúc nào qua `summary.nextDueAt`; ô Từ đã thuộc có chú thích) và 2.27 (`GET /admin/stats`, khối Quản trị ở Tổng quan chỉ cho ADMIN).
- **Vấn đề đã thấy:** nội dung lệch trái ở màn hình rộng; nút chế độ học trải dài khó hình dung; header có ảnh đại diện nhưng không có tên; `select` mặc định xấu; Tổng quan ít thông tin; Bộ từ và Khám phá trông giống nhau; người học không hiểu khi nào thẻ đến hạn và khi nào được tính là đã thuộc; giọng đọc khó nghe và đọc nhanh.
- **Quy tắc đang chạy:** trả lời đúng lần đầu thì thẻ hẹn ôn sau 1 ngày; trả lời đúng khi thẻ đã đến hạn thì giãn ra 6 ngày, rồi nhân với hệ số dễ; trả lời sai thì hẹn lại sau 10 phút. Thẻ "đã thuộc" khi khoảng ôn từ 6 ngày (`MASTERED_INTERVAL_DAYS`), nên cần ít nhất hai lần đúng ở hai ngày khác nhau. Học dồn trong cùng ngày không giãn lịch. Việc 2.20 phải nói rõ quy tắc này trên giao diện, không đổi thuật toán.
- **Phải có:** mỗi trang một hành động chính; đủ loading, empty, error, success; light, dark, 360 px, bàn phím, vùng bấm 44 px; hiệu ứng 150 đến 300 ms và tắt khi `prefers-reduced-motion`; chỉ dùng token trong `docs/05-ui-tokens.md`, thiếu token thì thêm vào tài liệu trước.
- **Giọng đọc (2.23):** chọn giọng `en-US` hoặc `en-GB` có trên máy, không có thì dùng giọng mặc định và báo cho người dùng; tốc độ chậm khoảng 0,7.
- **Cách test:** component cho từng trạng thái; E2E audit accessibility ở light, dark, 360 px cho các trang đã đổi; Lighthouse trang giới thiệu không thấp hơn trước.

### UC-X7. Sắp xếp và học gọn hơn (góp ý ngày 2026-11-20)

- **Việc:** 2.28 đến 2.36. **Người dùng:** học sinh, chủ bộ từ. **Trạng thái:** Đủ. Đã có 2.28 đến 2.36.
- **2.28, Header trang bộ từ:** chủ bộ chỉ thấy "Sửa bộ từ" và nút menu "Thao tác khác" (nhập thêm thẻ, tải, cập nhật hoặc xoá bản offline, xoá bộ từ có xác nhận). Thư mục là chip trên dòng thông tin, bấm để chuyển hoặc gỡ thư mục. Người xem khác thấy "Sao chép bộ từ" và nút tải về máy.
- **2.29, Thẻ bộ từ dùng chung:** Bộ từ, Khám phá và "Bộ từ gần đây" ở Tổng quan dùng cùng một thẻ: tên, mô tả hai dòng, số thẻ, phạm vi, ngày cập nhật hoặc tác giả. Lưới 1 cột ở 360 px, 2 cột ở 768 px, 3 cột từ 1024 px.
- **2.30, Thư mục kiểu trình quản lý file:** trang Bộ từ có cột thư mục bên trái (Tất cả, Chưa xếp thư mục, từng thư mục kèm số bộ), cột cuộn riêng và có ô lọc khi nhiều thư mục. Bấm một thư mục để mở, có đường dẫn "Bộ từ / Lớp 6" và nút đóng về Tất cả. Mỗi thẻ có menu "Chuyển vào thư mục" và "Gỡ khỏi thư mục" cho bàn phím và màn hình cảm ứng. Tạo, đổi tên, xoá thư mục ngay trên cột thư mục. Ở 360 px cột thư mục thành hàng chip cuộn ngang.
- **2.34, Kéo thả:** kéo thẻ bộ từ thả vào một thư mục trên cột thư mục để chuyển, thả vào "Chưa xếp thư mục" để gỡ. Thư mục đang được kéo qua sáng lên; thả thất bại thì thẻ về chỗ cũ và báo lỗi. Cảm ứng phải giữ một chút mới kéo để không cản cuộn trang. Kéo bằng tay nắm trên thẻ, không kéo cả thẻ để bấm mở bộ từ vẫn dễ.
- **2.35, Trang Ôn hôm nay:** đầu trang là khối tóm tắt nổi bật: số thẻ đến hạn cỡ lớn, số bộ có thẻ đến hạn, ô chọn chế độ ôn và nút chính "Ôn tất cả". Bộ có thẻ đến hạn hiện bằng thẻ bộ từ chung, mỗi thẻ có số thẻ đến hạn và nút "Ôn ngay". "Khi nào thẻ đến hạn ôn?" là nút có icon thông tin, viền và mũi tên xoay khi mở, giải thích lịch ôn. Khi không có thẻ đến hạn, khối tóm tắt báo đã ôn xong và thời điểm thẻ tiếp theo đến hạn.
- **2.36, Rời trang khi chưa lưu:** trang tạo bộ từ, sửa bộ từ và nhập từ file theo dõi dữ liệu chưa lưu. Bấm link, nút quay lại hoặc thanh điều hướng trong app thì hiện `ConfirmDialog` "Rời trang khi chưa lưu?" với hai nút "Ở lại" (focus đầu tiên) và "Rời trang". Đóng tab, tải lại hoặc gõ địa chỉ khác thì trình duyệt tự hiện hộp thoại mặc định qua `beforeunload`, app không đổi được nội dung. Form chưa nhập gì hoặc vừa lưu xong thì không hỏi.
- **2.31, Lộ trình "Bắt đầu học":** nút chính chạy các bước liên tiếp trên cùng bộ từ: Xem thẻ → Trắc nghiệm → Ghép cặp → Luyện viết. Bước không dùng được (bộ quá ít thẻ cho Ghép cặp) thì bỏ qua. Thanh bước cho biết đang ở bước nào, mỗi bước lưu phiên học như chế độ lẻ, cuối lộ trình có màn tổng kết. Flashcard thành một chế độ riêng trong lưới "Chọn cách học".
- **2.32, Khung thẻ khi tạo và sửa bộ từ:** danh sách thẻ nằm trong khung cao tối đa khoảng 60% màn hình, có thanh cuộn riêng; thêm thẻ thì khung tự cuộn tới thẻ mới và đặt focus vào ô thuật ngữ; nút lưu luôn thấy được.
- **2.33, Xác nhận xoá bằng hộp thoại:** mọi thao tác xoá dùng chung một `ConfirmDialog`: tiêu đề nói rõ xoá gì ("Xoá bộ từ "Hương 1"?"), hậu quả (không khôi phục được, bộ từ trong thư mục được giữ lại), nút huỷ nhận focus đầu tiên, nút xoá màu `danger` và hiện trạng thái đang xoá. Esc hoặc bấm ra ngoài thì huỷ, đóng xong focus trả về nút đã mở. Bố cục trang không đổi khi hỏi xác nhận. Lỗi khi xoá hiện ngay trong hộp thoại, không đóng.
- **Ngoại lệ:** chưa có thư mục nào thì không hiện chip thư mục; kéo thả thất bại thì thẻ về chỗ cũ và báo lỗi; mất mạng giữa lộ trình thì giữ bước đang làm.
- **Cách test:** component test cho menu, chip thư mục, lộ trình chuyển bước; E2E kéo thả bằng bàn phím và chuột, học hết lộ trình; audit accessibility ở light, dark và 360 px.

### UC-X8. Nhập, tạo bộ từ và trang công khai dễ hiểu hơn (góp ý ngày 2026-11-20)

- **Việc:** 2.37 đến 2.40. **Người dùng:** học sinh, chủ bộ từ, khách. **Trạng thái:** Đang làm. Đã có 2.37 (`import-source.test`: tóm tắt cách đọc, nhãn cột có giá trị, báo ký tự đã nhận, chỉ một cột thì mở sẵn).
- **Vấn đề đã thấy:**
  - Trang nhập: người dùng không hiểu "Ký tự phân cách" là gì; năm ô chọn cột hiện ra cùng lúc dù trang đã tự nhận cột; không biết "Cột 1" là cột nào trong dữ liệu của mình.
  - File mẫu `.csv`: Excel cài tiếng Việt dùng dấu `;` làm dấu phân cách danh sách nên mở file mẫu ra thấy cả dòng `Từ,Nghĩa,Phiên âm,Ví dụ` dồn vào cột A.
  - File mẫu `.xlsx`: đúng cột nhưng sơ sài: tiêu đề giống dữ liệu, cột hẹp, chỉ 3 dòng, không có hướng dẫn.
  - Form tạo bộ từ: phần thông tin chung cao, mô tả chiếm nhiều chỗ, "Ai xem được" là ô chọn không nói rõ từng lựa chọn khác nhau ra sao.
  - Trang công khai `/public/sets/:id` vẫn là thiết kế cũ (hàng 9 nút trải dài) và chủ bộ không biết vì sao cần link "Xem trang công khai".

#### 2.37, Trang nhập dễ hiểu

- **Phải có:**
  - Trang chia ba bước có số: **1. Lấy file mẫu** (không bắt buộc), **2. Đưa danh sách vào** (dán hoặc chọn file), **3. Kiểm tra cách đọc**, cuối trang là nút "Xem trước".
  - Ô "Ký tự phân cách" đổi tên thành **"Từ và nghĩa cách nhau bằng"**, các lựa chọn có ví dụ: "Tự nhận (nên dùng)", "Phím Tab: dán từ Excel, Google Sheets", "Dấu phẩy: `apple, quả táo`", "Dấu chấm phẩy: `apple; quả táo`", "Gạch ngang: `apple - quả táo`". Dưới ô có dòng "Đã nhận: Tab" khi đang ở Tự nhận và đã có dữ liệu.
  - Ô chọn cột ghi kèm giá trị dòng đầu của cột đó: "Cột 1: apple", "Cột 2: quả táo". Chưa có dữ liệu thì chỉ ghi "Cột 1".
  - Bước 3 mặc định thu gọn thành một dòng tóm tắt ("Cách nhau bằng phím Tab. Lấy từ ở cột 1, nghĩa ở cột 2, bỏ dòng tiêu đề.") và nút "Đổi cách đọc" để mở đầy đủ. Chưa có dữ liệu thì tóm tắt báo trang sẽ tự nhận sau khi dán hoặc chọn file. Lỗi ở bước 3 hoặc chỉ tách được một cột thì tự mở ra.
  - Ô "Dòng đầu là tiêu đề" có giải thích ngắn: "Bật nếu dòng đầu là tên cột như Từ, Nghĩa". Ô tích cỡ 20 px, vùng bấm là cả dòng cao 44 px.
- **Ngoại lệ:** dữ liệu chỉ có một cột thì báo "Chưa tách được từ và nghĩa, hãy chọn cách ngăn cách khác"; dòng đầu rỗng thì ô cột không ghi giá trị; giá trị dài cắt bớt với dấu ba chấm.
- **Không đổi:** API `POST /import/preview`, schema `ImportOptions`, giới hạn 2 MB và 2.000 thẻ.

#### 2.38, File mẫu rõ ràng

- **Phải có:**
  - Chỉ còn một nút **"Tải file mẫu Excel (.xlsx)"**. Bỏ nút tải mẫu `.csv`; trang vẫn nhận file `.csv` và `.txt` khi tải lên.
  - Sheet đầu tên "Từ vựng": hàng tiêu đề giữ đúng `Từ`, `Nghĩa`, `Phiên âm`, `Ví dụ` để tự nhận cột vẫn chạy; tiêu đề in đậm, có nền, cột bắt buộc (`Từ`, `Nghĩa`) nền đậm hơn cột không bắt buộc; cố định hàng tiêu đề khi cuộn; độ rộng cột vừa nội dung; 6 đến 8 dòng ví dụ gồm từ đơn, cụm từ, dòng không có phiên âm, dòng không có ví dụ.
  - Sheet thứ hai "Hướng dẫn": mỗi cột dùng để làm gì, cột nào bắt buộc, giới hạn 2.000 thẻ, chỉ sheet đầu được đọc, xoá dòng ví dụ trước khi nhập.
  - `lib/xlsx.ts` thêm được kiểu chữ, nền, độ rộng cột và cố định hàng; vẫn không thêm thư viện mới.
- **Ngoại lệ:** mở được bằng Excel, LibreOffice, Google Sheets, Numbers; tải file mẫu về rồi chọn lại ngay thì xem trước ra đúng các dòng ví dụ, không đọc sheet "Hướng dẫn".

#### 2.39, Form tạo và sửa bộ từ gọn

- **Phải có:**
  - Tên bộ từ một hàng; mô tả mặc định 2 dòng và tự giãn khi gõ dài.
  - "Ngôn ngữ của từ" và "Ngôn ngữ của nghĩa" chung một hàng, giữa là nút đảo chiều có nhãn cho trình đọc màn hình.
  - "Ai xem được" thành nhóm hai lựa chọn dạng thẻ (radio), mỗi lựa chọn có mô tả:
    - **Riêng tư:** chỉ mình bạn xem và học. Không hiện ở Khám phá.
    - **Công khai:** ai có đường dẫn đều xem và học thử được, kể cả người chưa đăng nhập. Hiện ở Khám phá, người đã đăng nhập sao chép được về tài khoản của họ.
  - Bộ đang ở `CLASS` (sau giai đoạn 3) vẫn hiện lựa chọn hiện tại, chưa cho chọn `CLASS` ở form này.
  - Áp dụng cho cả trang tạo, trang sửa và ô "Ai xem được" ở trang nhập vào bộ mới.
- **Ngoại lệ:** 360 px thì ngôn ngữ xuống hai hàng, nút đảo chiều vẫn bấm được; hai ngôn ngữ trùng nhau thì vẫn cho lưu như hiện tại.

#### 2.40, Trang công khai theo thiết kế mới

- **Vì sao cần trang công khai:** đây là trang duy nhất người **chưa đăng nhập** xem được một bộ từ: đường dẫn chia sẻ qua Zalo, Facebook; kết quả tìm kiếm Google (có metadata SEO); Khám phá của khách. Không có trang này thì bộ Công khai chỉ có ý nghĩa với người đã có tài khoản.
- **Ai xem được:** mọi người khi bộ ở Công khai và không bị ADMIN ẩn. Bộ Riêng tư, Lớp học, bị ẩn hoặc đã xoá thì báo "Không tìm thấy bộ từ".
- **Phải có:**
  - Khách: header giống trang bộ từ (tên, mô tả, dòng thông tin tác giả, số thẻ), nút "Sao chép đường dẫn" và "Đăng nhập để sao chép"; nút chính "Học thử" và lưới chế độ học dùng chung `StudyModeGrid` (dạng cho khách); danh sách thẻ như trang bộ từ; dải mời đăng ký để lưu tiến độ.
  - Người đã đăng nhập mở `/public/sets/:id` thì chuyển thẳng tới `/sets/:id`, giống cách `/explore` đang làm.
  - Trang bộ từ của chủ bỏ link "Xem trang công khai", chỉ giữ "Sao chép đường dẫn" khi bộ Công khai.
- **Ngoại lệ:** bộ chưa có thẻ hiện trạng thái trống; chuyển bộ sang Riêng tư thì đường dẫn cũ báo không tìm thấy; trang vẫn render phía server để giữ SEO.
- **Cách test:** component test cho bước nhập, nhãn cột có giá trị, ô ngăn cách, nhóm "Ai xem được", trang công khai cho khách; unit test file mẫu (hai sheet, tiêu đề, kiểu chữ) và đọc lại file mẫu chỉ lấy sheet đầu; E2E tải file mẫu rồi nhập lại, khách mở trang công khai học thử, người đã đăng nhập mở đường dẫn công khai được chuyển vào app; audit accessibility ở light, dark, 360 px; mở file mẫu bằng Excel thật (thủ công).

## Giai đoạn 3: Lớp học

Cần chốt trước: cách một tài khoản trở thành giáo viên (việc 3.2).

### UC-C1. Lớp và thành viên

- **Việc:** 3.1, 3.2, 3.3, 3.8. **Người dùng:** giáo viên, học sinh.
- **Phải có:** yêu cầu quyền giáo viên và ADMIN duyệt; tạo, sửa, lưu trữ lớp; mã tham gia có thể đổi; xoá thành viên; học sinh rời lớp.
- **Ngoại lệ:** mã sai hoặc đã đổi; tham gia hai lần; học sinh không xem được danh sách lớp của người khác.
- **Cách test:** integration phân quyền đầy đủ; E2E giáo viên tạo lớp, học sinh tham gia.

### UC-C2. Giao bài và bộ từ của lớp

- **Việc:** 3.4, 3.5, 3.7, 3.8. **Người dùng:** giáo viên, học sinh. **Trạng thái:** Đang làm. Đã có 3.4 (bộ `CLASS` xem được bởi giáo viên và thành viên lớp chưa lưu trữ đã được giao bộ, test `class-visibility.integration`).
- **Phải có:** bộ `CLASS` chỉ thành viên xem được; giao bộ từ, chế độ, hạn nộp; học sinh thấy bài cần làm.
- **Ngoại lệ:** học sinh vào lớp sau khi đã giao; quá hạn; bộ bị xoá sau khi giao; học sinh rời lớp mất quyền xem.
- **Cách test:** integration quyền `CLASS`; test mốc hạn nộp theo giờ Việt Nam; E2E giao bài, học, trạng thái hoàn thành.

### UC-C3. Kết quả lớp

- **Việc:** 3.6, 3.7. **Người dùng:** giáo viên.
- **Phải có:** tỉ lệ hoàn thành, điểm theo học sinh, từ cả lớp hay sai, trạng thái chưa có dữ liệu.
- **Ngoại lệ:** học sinh đã rời lớp; lớp đông phải phân trang; giáo viên khác không xem được.
- **Cách test:** integration số liệu và quyền; kiểm tra truy vấn với dữ liệu lớn.

## Giai đoạn 4: Luyện nói và offline

### UC-O1. Luyện nói

- **Việc:** 4.1, 4.4. **Người dùng:** người học. **Trạng thái:** Đã có enum `SPEAK`, strategy và API (4.1, `speak.test`, integration). Giao diện (4.4): bấm nói thì trình duyệt xin micro, hiện câu nghe được và đúng sai, thử lại chỉ để luyện (điểm theo lần đầu), bỏ qua gửi rỗng; báo khi từ chối micro, không nghe thấy, trình duyệt không hỗ trợ. `Permissions-Policy` cho `microphone=(self)`. Test: `speak-mode.test`, E2E với bộ nhận dạng giả, audit.
- **Phải có:** xin quyền micro khi bắt đầu, ghi nhận và so với từ đích, cho thử lại và bỏ qua.
- **Ngoại lệ:** từ chối micro; trình duyệt không hỗ trợ; môi trường ồn. `Permissions-Policy` và CSP phải được nới đúng phạm vi.
- **Cách test:** unit so khớp; E2E với bộ nhận dạng giả; thủ công trên điện thoại.

### UC-O2. Cài đặt và học offline

- **Việc:** 4.2, 4.3, 4.5, 4.6. **Người dùng:** người học. **Trạng thái:** Đã có 4.2: `manifest.webmanifest` (mở vào Tổng quan, `standalone`), icon PNG 192 và 512 từ `/pwa-icon/[size]`, `public/sw.js` lưu tạm `/_next/static` và icon, điều hướng khi mất mạng trả `/offline`, không lưu request `/api/`. Test `manifest.test`, E2E `pwa.spec`. Đã có 4.3: `lib/offline-store.ts` lưu bộ từ trong IndexedDB, nút Tải về máy, Cập nhật bản offline, Xoá bản offline ở trang bộ từ, báo khi hết dung lượng; trang `/offline` liệt kê bộ đã tải và xem thẻ; đăng xuất xoá cơ sở dữ liệu offline. Đã có 4.5: nút Học offline ở trang `/offline` mở phiên Flashcard bằng `createGuestBackend({ loadSet, onFinish })`, phiên xong lưu vào kho `pending` trong IndexedDB; service worker lưu sẵn cả mã của trang offline; E2E tắt mạng học hết bộ và có một phiên trong hàng đợi. Đã có 4.6: `syncPendingSessions()` chạy khi vào app đã đăng nhập và khi có mạng lại, tạo phiên với đúng thẻ đã học, gửi đáp án theo lô 200, kết thúc, xoá khỏi hàng đợi; bộ đã xoá hoặc không còn quyền thì bỏ, lỗi mạng thì giữ lại; E2E tải về, học offline, có mạng lại thấy thông báo đã gửi. Đăng xuất trước khi đồng bộ sẽ xoá các phiên chưa gửi.
- **Phải có:** manifest, cài lên thiết bị, chọn bộ để tải về, học khi mất mạng, hàng đợi đáp án đồng bộ khi có mạng.
- **Ngoại lệ:** bộ đã đổi khi offline; học trên hai thiết bị; hết dung lượng; đăng xuất phải xoá dữ liệu offline.
- **Cách test:** E2E chế độ offline của Playwright; integration gửi trùng đáp án; thủ công trên Android và iOS.

## Ý tưởng chưa xếp lịch

Các mục này chưa nằm trong file tiến độ, cần người phụ trách chọn trước khi làm.

- Tuỳ chọn phiên học: số câu, trộn thứ tự, đảo chiều từ và nghĩa.
- Xác minh email khi đăng ký.
- Thùng rác để khôi phục bộ từ trong 30 ngày.
- Sitemap và ảnh chia sẻ cho trang công khai.
