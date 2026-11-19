# ADR 0002: Đọc file XLSX trên trình duyệt bằng read-excel-file

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-11-19

## Bối cảnh

Người dùng cần nhập danh sách từ từ file Excel (việc 1.51). Luồng nhập hiện tại nhận text: web đọc file `.txt`, `.csv` thành chuỗi rồi gửi `POST /import/preview`, `parseImport` trong `@vocab/shared` phân tích. File XLSX là file zip chứa XML, có thể chứa công thức, và có thể bị làm giả để giải nén ra rất lớn. `docs/04-security.md` yêu cầu không chạy công thức Excel.

## Quyết định

- Dùng **`read-excel-file`** (bản `read-excel-file/browser`, ghim phiên bản) trong `apps/web`, đọc file ngay trên trình duyệt. Thư viện được tải lazy bằng `import()` chỉ khi người dùng chọn file `.xlsx`, để không làm nặng bundle của các trang khác.
- Bản `browser` phân tích file trong Web Worker tạo từ `blob:`, nên CSP có `worker-src 'self' blob:`. Bản `universal` không dùng worker cho phần đọc XML, nhưng phần giải nén vẫn có thể tạo worker với file lớn, nên không tránh được quy tắc này.
- Chỉ đọc sheet đầu tiên. Mỗi ô lấy **giá trị Excel đã tính sẵn và lưu trong file**, không tính lại công thức. Ô có công thức nhưng không có giá trị lưu sẵn được coi là ô trống.
- Các hàng được chuyển thành text ngăn bằng tab, ký tự tab và xuống dòng trong ô được thay bằng dấu cách, rồi gửi `POST /import/preview` với `delimiter: 'tab'`. API và `parseImport` không phải đọc file nhị phân.
- Chỉ nhận `.xlsx`. File `.xls` (định dạng cũ) vẫn bị từ chối và web hướng dẫn lưu lại thành `.xlsx` hoặc CSV.

## Lý do

- Thư viện nhỏ, chỉ đọc, không có phần ghi file hay tính công thức, nên bề mặt tấn công hẹp.
- Đọc trên trình duyệt thì server không phải giải nén file của người dùng, không lo zip bomb làm treo API. Mọi giới hạn 2.000.000 ký tự và 2.000 dòng của API vẫn áp dụng như với CSV.
- Lấy giá trị đã tính sẵn khớp với những gì người dùng thấy trong Excel và không cần chạy công thức.

## Hệ quả

- Thêm dependency `read-excel-file` cho `@vocab/web`. Kiểm tra `npm audit` khi cài và theo dõi qua Dependabot.
- CSP thêm `worker-src 'self' blob:`. Vì `script-src` đã có `'unsafe-inline'`, quy tắc này gần như không mở thêm bề mặt tấn công: chỉ script đã chạy trên trang mới tạo được worker từ `blob:`.
- Test dựng file XLSX bằng `fflate` (devDependency) trong `src/test/build-xlsx.ts`, không commit file nhị phân.
- Kết quả đọc file phụ thuộc trình duyệt, nên `read-file.ts` cần test với file XLSX mẫu, gồm file hỏng, file rỗng, ô công thức và dấu tiếng Việt.
- File quá 2 MB bị chặn trước khi giải nén.

## Phương án đã cân nhắc

- **`exceljs`:** đọc và ghi đầy đủ, nhưng bundle lớn, nhiều tính năng không dùng tới.
- **`xlsx` (SheetJS) trên npm:** bản 0.18.5 trên npm không còn được cập nhật và còn lỗ hổng chưa vá.
- **Đọc trên API:** giữ web nhẹ hơn, nhưng API phải nhận file nhị phân, giải nén và tự chống zip bomb.
