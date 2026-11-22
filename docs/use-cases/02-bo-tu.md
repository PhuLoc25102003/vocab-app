# Use case: bộ từ và thẻ từ

Giới hạn chung: tên bộ 200 ký tự, mô tả 2.000, từ 200, nghĩa 1.000, tối đa 2.000 thẻ mỗi bộ.

## UC-S1. Xem danh sách bộ từ của tôi

- **Việc:** 1.7, 1.10, 1.43. **Người dùng:** người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:** danh sách dạng thẻ với tên, số thẻ, phạm vi, ngày cập nhật; phân trang trên URL; nút tạo bộ; ô tìm theo tên; chọn cách sắp xếp; thao tác chuột phải (desktop) và nút ba chấm ⋯ (mobile) tích hợp đầy đủ: Bắt đầu học, Sửa, Chuyển thư mục, Nhập thêm thẻ, Lưu ngoại tuyến, Sao chép liên kết, Tạo bản sao, Xoá, và Ẩn bộ từ (dành cho Admin).
- **Kéo thả và thao tác nhanh:** Toàn bộ thẻ bộ từ có thể kéo thả trực tiếp (`@dnd-kit/core`) vào các thư mục ở cột bên trái; cơ chế dùng GPU hardware acceleration và `DragOverlay` mount qua React Portal nên hoàn toàn không gây re-render các thẻ khác trong danh sách; chuột click bình thường (< 8px) mở bộ từ, giữ và rê (>= 8px) kích hoạt kéo. Bỏ icon chuyển thư mục rời rạc trên thẻ để tránh lặp với menu.
- **Luồng chính:** mở `/sets`, thấy bộ mới sửa ở đầu, tìm hoặc sắp xếp, mở một bộ, quay lại vẫn đúng trang và từ khoá.
- **Ngoại lệ:** chưa có bộ nào; không có kết quả tìm kiếm; số trang vượt quá; lỗi mạng có nút thử lại.
- **Test đã có:** `sets.integration`, `my-sets.test`, `set-context-menu.test`.
- **Test cần thêm:** E2E tìm rồi mở rồi quay lại.

## UC-S2. Tạo bộ từ

- **Việc:** 1.7, 1.11, 1.37, 1.38. **Người dùng:** người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:** tên, mô tả, ngôn ngữ từ và nghĩa, phạm vi Riêng tư hoặc Công khai, soạn thẻ, nút lưu, nút huỷ, nút quay lại. Tự động nhận biết thư mục đang đứng (`?folder=...`) để lưu vào thư mục đó.
- **Luồng chính:** từ `/sets` (hoặc thư mục đang xem) bấm "Tạo bộ từ", nhập, lưu, thấy thông báo và tới trang chi tiết. Bộ từ mới tự động nằm trong thư mục đang mở. Nút quay lại/huỷ trả về đúng thư mục đó.
- **Ngoại lệ:**
  - Dữ liệu sai: focus ô lỗi đầu tiên, giữ nguyên nội dung.
  - Mất mạng khi lưu: báo lỗi, giữ nội dung, bấm lưu lại được.
  - Bấm lưu nhiều lần: chỉ tạo một bộ.
  - Đã nhập mà rời trang: hỏi xác nhận.
- **Test đã có:** `sets.integration`, `set-form.test`, E2E tạo bộ công khai.
- **Đã đổi:** form gọn hơn, giữ ngầm tiếng Anh/tiếng Việt, "Ai xem được" là hai thẻ lựa chọn có mô tả, tạo từ thư mục nào thì tự động gán thư mục đó.

## UC-S3. Soạn thẻ từ

- **Việc:** 1.8, 1.11. **Người dùng:** chủ bộ từ. **Trạng thái:** Đủ.
- **Phải có:** thêm, xoá, đổi thứ tự thẻ; từ, nghĩa, phiên âm, ví dụ; bỏ qua dòng trống; chặn ở 2.000 thẻ.
- **Luồng chính:** nhập từng thẻ, thêm thẻ mới, đổi thứ tự, lưu toàn bộ trong một transaction.
- **Ngoại lệ:** thẻ thiếu từ hoặc nghĩa; vượt độ dài; đủ 2.000 thẻ thì khoá nút thêm; `id` thẻ không thuộc bộ bị từ chối.
- **Lưu ý dữ liệu:** thẻ giữ `id` khi sửa để không mất tiến độ học.
- **Test đã có:** `sets-cards.integration`, `card-fields.test`.
- **Test cần thêm:** E2E sửa một thẻ đã học, tiến độ của thẻ vẫn còn.

## UC-S4. Sửa bộ từ

- **Việc:** 1.7, 1.8, 1.11, 1.37, 1.38. **Người dùng:** chủ bộ, ADMIN. **Trạng thái:** Đủ.
- **Phải có:** form điền sẵn, lưu thông tin và thẻ, quay lại chi tiết.
- **Luồng chính:** từ chi tiết bấm "Sửa bộ từ", đổi nội dung, lưu, về chi tiết thấy dữ liệu mới. Nút quay lại của trình duyệt không mở lại form đã lưu.
- **Ngoại lệ:** không có quyền hoặc bộ đã xoá; lỗi khi lưu giữ nguyên nội dung; rời trang khi chưa lưu phải hỏi xác nhận.
- **Test đã có:** `sets.integration`, `sets-cards.integration`, `set-form.test`.
- **Test cần thêm:** E2E sửa rồi kiểm tra chi tiết, danh sách và trang công khai đều mới; người khác mở `/edit` bị từ chối.

## UC-S5. Xem chi tiết bộ từ

- **Việc:** 1.7, 1.12, 1.44, 1.46. **Người dùng:** chủ bộ, người xem bộ công khai, ADMIN. **Trạng thái:** Đủ.
- **Phải có:**
  - Tên, mô tả, thông tin bộ, danh sách thẻ có phát âm, 4 nút học, nút quay lại. Người xem từ Khám phá (`?from=explore`) có nút "Quay lại Khám phá" và menu chính giữ active tab "Khám phá"; từ Bộ từ có "Quay lại Bộ từ". Khi bắt đầu học lẻ hoặc học lộ trình, cờ `?from=explore` được giữ nguyên để màn hình kết quả và nút thoát hiển thị "Trở về" (`exitLabel = t('result.return')`) quay lại đúng bộ từ ở Khám phá.
  - Chủ bộ: sửa, xoá, sao chép liên kết (trong menu ba chấm ⋯), chuyển đổi nhanh trạng thái giữa Công khai và Riêng tư (`actions.makePublic` / `actions.makePrivate`). Bộ của chính mình không bao giờ hiện nút "Ẩn bộ từ".
  - Người khác: sao chép về tài khoản.
  - Quản trị viên (ADMIN): khi xem bộ của người khác có nút "Ẩn bộ từ" / "Bỏ ẩn bộ từ" (icon EyeOff/Eye). Thứ tự sắp xếp nút luôn đảm bảo nút ba chấm `[...]` ở cuối cùng bên phải (`[Sửa bộ từ]` -> `[Chuyển thành Riêng tư/Ẩn bộ từ]` -> `[...]`), không bị kẹp menu ở giữa các nút hành động chính.
  - Tiến độ của bộ: số thẻ đã thuộc, đang học, đến hạn.
- **Luồng chính:** mở bộ, xem tiến độ, chọn chế độ học hoặc ôn thẻ đến hạn.
- **Ngoại lệ:** bộ không tồn tại hoặc không có quyền; bộ chưa có thẻ thì ẩn nút học và mời thêm thẻ; lỗi mạng có nút thử lại.
- **Test đã có:** `sets.integration`, `stats.integration`, `set-detail.test`, `set-progress.test`, `copy-link-button.test`.

## UC-S6. Xoá bộ từ

- **Việc:** 1.7. **Người dùng:** chủ bộ, ADMIN. **Trạng thái:** Đủ.
- **Phải có:** bước xác nhận ngay tại chỗ, xoá mềm, biến mất khỏi danh sách, Khám phá và trang công khai.
- **Luồng chính:** bấm xoá, xác nhận, về `/sets` và thấy thông báo.
- **Ngoại lệ:** huỷ thì trả focus về nút xoá; lỗi API báo bằng thông báo và giữ nguyên trang; người không có quyền nhận 403.
- **Test đã có:** `sets.integration`, `set-detail.test`.
- **Test cần thêm:** E2E xoá rồi mở lại đường dẫn cũ thấy "Không tìm thấy bộ từ".

## UC-S7. Sao chép bộ từ

- **Việc:** 1.9. **Người dùng:** người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:** nút sao chép ở bộ của người khác, bản sao riêng tư thuộc người bấm, tên có thêm "(bản sao)", tiến độ bắt đầu từ đầu.
- **Luồng chính:** mở bộ công khai, bấm sao chép, tới bản sao của mình.
- **Ngoại lệ:** khách được mời đăng nhập rồi quay lại đúng bộ; bộ không còn xem được trả 404; tên dài vẫn hợp lệ sau khi thêm hậu tố.
- **Test đã có:** `sets-duplicate.integration`, `set-detail.test`.
- **Test cần thêm:** E2E tài khoản B sao chép bộ của A, sửa bản sao, bộ gốc không đổi.

## UC-S8. Trang công khai cho khách

- **Việc:** 1.12, 1.46. **Người dùng:** khách, người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:** xem không cần đăng nhập, có metadata cho SEO, nút học thử, mời đăng nhập để sao chép, nút quay lại Khám phá, sao chép đường dẫn.
- **Luồng chính:** mở đường dẫn được chia sẻ, xem thẻ, học thử, đăng nhập để lưu tiến độ.
- **Ngoại lệ:** bộ riêng tư hoặc đã xoá hiện "Không tìm thấy bộ từ" và không được index; người đã đăng nhập thấy nút mở trong tài khoản.
- **Test đã có:** `sets-public.integration`, `public-set.test`, E2E khách học thử.
- **Test cần thêm:** E2E đổi bộ sang riêng tư thì đường dẫn công khai hết hiệu lực, kể cả khi trang đã được cache.
- **Đã đổi (2.40, UC-X8):** header như trang bộ từ, nút chính "Học thử" và lưới chế độ học dùng chung, dải mời tạo tài khoản cuối trang. Người có phiên mở `/public/sets/:id` được `proxy` chuyển sang `/sets/:id`. Trang bộ từ của chủ bỏ link "Xem trang công khai", giữ "Sao chép đường dẫn".

## UC-S9. Khám phá bộ từ công khai

- **Việc:** 1.7, 1.36, 1.42. **Người dùng:** khách, người đã đăng nhập. **Trạng thái:** Đủ.
- **Phải có:** tìm theo tên, sắp xếp (mới cập nhật, mới tạo, tên, nhiều thẻ nhất), phân trang, từ khoá và cách xếp trên URL, mở trang chi tiết phù hợp với phiên, thao tác nhanh chuột phải và nút ⋯ (Bắt đầu học, Sao chép về thư viện, Sao chép liên kết), lối vào từ trang giới thiệu.
- **Luồng chính:** khách từ trang chủ mở Khám phá, tìm, sắp xếp, mở bộ, học thử hoặc sao chép về thư viện.
- **Ngoại lệ:** không có kết quả có nút xem tất cả; từ khoá quá 100 ký tự; số trang vượt quá; lỗi mạng có nút thử lại.
- **Điều hướng:** khách vào `/explore` được chuyển tới `/public/explore`, người đã đăng nhập ở lại `/explore` với menu đầy đủ.
- **Test đã có:** `sets-public.integration`, `explore-sets.test`, `explore-card-menu.test`, E2E khách tìm và học thử.
- **Test cần thêm:** E2E người đã đăng nhập tìm rồi sao chép.

## UC-S10. Nhập danh sách từ

- **Việc:** 1.21, 1.22, 1.23, 1.51 (XLSX), 1.53 (phiên âm, ví dụ), 1.54 (file mẫu). **Người dùng:** người đã đăng nhập. **Trạng thái:** Đủ. Có text, CSV, XLSX (1.51), cột phiên âm và ví dụ (1.53), file mẫu và nhận diện tiêu đề mẫu khi chọn file hoặc dán vào ô trống (1.54). Hiện web báo người dùng lưu file Excel thành CSV.
- **Phải có:**
  - Dán text, tải `.csv`, `.xlsx`, `.txt` tối đa 2 MB.
  - Chọn ký tự phân cách, cột từ, cột nghĩa. Cột phiên âm và cột ví dụ **không bắt buộc**, mặc định là "Không có".
  - Nút "Tải file mẫu Excel (.xlsx)" (việc 2.38, trước đó có thêm mẫu `.csv`). Sheet đầu "Từ vựng" có hàng tiêu đề `Từ`, `Nghĩa`, `Phiên âm`, `Ví dụ` định dạng sẵn và 7 dòng ví dụ, như `apple`, `quả táo`, `/ˈæp.əl/`, `I eat an apple every day.`; sheet "Hướng dẫn" giải thích từng cột. Trang nhập có một dòng giải thích ngắn về các cột.
  - Nếu hàng đầu tiên trùng tiêu đề của file mẫu (không phân biệt hoa thường, bỏ khoảng trắng thừa), web tự bật "Dòng đầu là tiêu đề" và chọn đúng 4 cột. Người dùng vẫn đổi lại được.
  - Bảng xem trước hiện cả phiên âm và ví dụ khi có chọn cột, báo lỗi từng dòng, sửa hoặc bỏ dòng trước khi lưu.
  - Nhập vào bộ mới hoặc bộ có sẵn. Thẻ đã lưu có `phonetic` và `example` khi dòng có giá trị.
- **Luồng chính:** tải file mẫu, điền từ, tải file lên hoặc dán, xem trước, sửa lỗi, lưu trong một transaction, tới trang bộ từ.
- **Ngoại lệ:**
  - File sai định dạng, sai MIME, quá lớn, rỗng hoặc hỏng. File `.xls` cũ bị từ chối, kèm hướng dẫn lưu lại thành `.xlsx` hoặc CSV.
  - XLSX chỉ đọc sheet đầu tiên. Ô công thức lấy giá trị đã tính sẵn, không chạy công thức. Ô công thức không có giá trị lưu sẵn coi như trống (ADR 0002).
  - Ô phiên âm, ví dụ trống thì thẻ không có trường đó, không phải lỗi. Phiên âm dài quá giới hạn của từ, ví dụ dài quá giới hạn của nghĩa thì báo lỗi ở dòng đó.
  - Các cột được chọn phải khác nhau. Dòng thiếu cột phiên âm hoặc ví dụ thì coi như ô trống.
  - Vượt 2.000 thẻ, tính cả thẻ đang có.
  - Mã hoá UTF-8 có BOM, dấu tiếng Việt và ký tự IPA phải đúng.
  - Rời trang khi chưa lưu phải hỏi xác nhận.
- **Điểm vào:** nút "Nhập từ file" ở trang Bộ từ mở `/sets/import`, nút "Nhập thêm thẻ" của chủ bộ từ mở `/sets/import?setId=...`.
- **Test đã có:** `parse.test`, `template.test` (shared), `import-preview.integration`, `sets-import.integration`, `read-file.test` (gồm XLSX hợp lệ, hỏng, rỗng, ô công thức, dấu tiếng Việt và IPA, file `.xls`), `import-source.test` (gồm nhận diện tiêu đề mẫu khi chọn file và khi dán), `template-file.test`, `import-preview.test`, `import-wizard.test` (gồm cột phiên âm, ví dụ, cột trùng, lưu thẻ có phiên âm và ví dụ), E2E tải CSV có BOM, sửa dòng lỗi, lưu bộ mới rồi tải file `.xlsx` có cột phiên âm để nhập thêm vào bộ có sẵn, tải file mẫu `.xlsx` rồi chọn lại để kiểm tra tự chọn cột (7 thẻ), audit accessibility trang nhập.
- **Test cần thêm:** mở file mẫu `.xlsx` bằng LibreOffice và Google Sheets (thủ công). Đã mở bằng Excel trên Windows ngày 2026-11-20.
- **Đã đổi:** trang chia ba bước, đổi tên "Ký tự phân cách" (việc 2.37); file mẫu `.xlsx` có định dạng và sheet hướng dẫn, bỏ mẫu `.csv` vì Excel tiếng Việt dùng dấu `;` nên mở ra dồn hết vào cột A (việc 2.38). Xem UC-X8.
