import { IMPORT_TEMPLATE_HEADERS, IMPORT_TEMPLATE_ROWS } from '@vocab/shared';
import type { XlsxCell, XlsxSheet } from '@/lib/xlsx';

export const TEMPLATE_FILE_NAME = 'mau-nhap-tu-vung.xlsx';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Hai cột đầu bắt buộc nên tiêu đề nền đậm, các cột sau nền nhạt. */
const REQUIRED_COLUMNS = 2;
const COLUMN_WIDTHS = [18, 22, 18, 40, 35];
const GUIDE_WIDTH = 90;

const GUIDE: readonly (readonly [text: string, isTitle?: boolean])[] = [
  ['Cách điền file mẫu', true],
  ['Mỗi dòng ở sheet "Từ vựng" là một thẻ. Xoá các dòng ví dụ rồi điền từ của bạn.'],
  ['Từ (bắt buộc): từ hoặc cụm từ cần học, ví dụ apple, look after.'],
  ['Nghĩa (bắt buộc): nghĩa tiếng Việt hoặc định nghĩa ngắn.'],
  ['Phiên âm (không bắt buộc): cách đọc theo IPA, ví dụ /ˈæp.əl/. Không biết thì để trống.'],
  ['Ví dụ (không bắt buộc): một câu có chứa từ. Chế độ Điền từ dùng câu này để ra đề.'],
  ['Hình ảnh (không bắt buộc): link URL ảnh minh hoạ (Unsplash, Pixabay...).'],
  [''],
  ['Lưu ý khi nhập', true],
  ['Giữ nguyên hàng tiêu đề Từ, Nghĩa, Phiên âm, Ví dụ, Hình ảnh để trang tự chọn đúng cột.'],
  ['Trang chỉ đọc sheet đầu tiên ("Từ vựng"). Sheet hướng dẫn này không được nhập.'],
  ['Mỗi bộ từ tối đa 2.000 thẻ, mỗi file tối đa 2 MB.'],
  ['Lưu file dạng .xlsx. File .xls cũ cần mở bằng Excel rồi lưu lại thành .xlsx.'],
];

/** Sheet đầu là dữ liệu mẫu để đọc lại được, sheet sau là hướng dẫn. */
export function templateSheets(): XlsxSheet[] {
  const headers = [...IMPORT_TEMPLATE_HEADERS, 'Hình ảnh'];
  const header: XlsxCell[] = headers.map((text, index) => ({
    text,
    style: index < REQUIRED_COLUMNS ? 'header' : 'headerOptional',
  }));
  const rows: XlsxCell[][] = IMPORT_TEMPLATE_ROWS.map((row) => [
    ...row.map((cell) => cell || null),
    null,
  ]);
  const guide: XlsxCell[][] = GUIDE.map(([text, isTitle]) => [
    text ? { text, style: isTitle ? 'title' : 'wrap' } : null,
  ]);
  return [
    { name: 'Từ vựng', rows: [header, ...rows], widths: COLUMN_WIDTHS, freezeFirstRow: true },
    { name: 'Hướng dẫn', rows: guide, widths: [GUIDE_WIDTH] },
  ];
}

export async function buildTemplateFile(): Promise<Blob> {
  // Chỉ tải phần dựng XLSX khi người dùng bấm tải file mẫu.
  const { buildXlsx } = await import('@/lib/xlsx');
  return new Blob([buildXlsx(templateSheets()) as BlobPart], { type: XLSX_MIME });
}

/** Tải file mẫu về máy bằng liên kết tạm. */
export async function downloadTemplate(): Promise<void> {
  const url = URL.createObjectURL(await buildTemplateFile());
  const link = document.createElement('a');
  link.href = url;
  link.download = TEMPLATE_FILE_NAME;
  document.body.append(link);
  link.click();
  link.remove();
  // Đợi trình duyệt bắt đầu tải rồi mới thu hồi URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
