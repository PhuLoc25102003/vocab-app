export const IMPORT_FILE_MAX_BYTES = 2 * 1024 * 1024;
export const IMPORT_FILE_ACCEPT = '.txt,.csv,text/plain,text/csv';

const ALLOWED_EXTENSIONS = ['.txt', '.csv'];
// Windows thường gắn MIME của Excel cho file CSV, một số trình duyệt để trống.
const ALLOWED_TYPES = ['', 'text/plain', 'text/csv', 'application/csv', 'application/vnd.ms-excel'];

export class ImportFileError extends Error {
  override name = 'ImportFileError';
}

/** Kiểm tra file rồi đọc thành text UTF-8. Lỗi ném ra `ImportFileError` có thông báo tiếng Việt. */
export async function readImportFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    throw new ImportFileError(
      'Chưa đọc được file Excel. Hãy lưu thành CSV (UTF-8) trong Excel rồi chọn lại.',
    );
  }
  if (!ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    throw new ImportFileError('Chỉ nhận file .txt hoặc .csv.');
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ImportFileError('Nội dung file không phải văn bản. Hãy chọn file .txt hoặc .csv.');
  }
  if (file.size === 0) {
    throw new ImportFileError('File đang trống.');
  }
  if (file.size > IMPORT_FILE_MAX_BYTES) {
    throw new ImportFileError('File tối đa 2 MB. Hãy chia nhỏ rồi nhập từng phần.');
  }

  const text = await file.text();
  if (text.includes('\u0000')) {
    throw new ImportFileError('File bị hỏng hoặc không phải văn bản UTF-8.');
  }
  return text;
}
