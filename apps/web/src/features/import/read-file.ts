import { vi } from '@/lib/i18n/messages-vi';

export const IMPORT_FILE_MAX_BYTES = 2 * 1024 * 1024;

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const IMPORT_FILE_ACCEPT = `.txt,.csv,.xlsx,text/plain,text/csv,${XLSX_MIME}`;

const TEXT_EXTENSIONS = ['.txt', '.csv'];
// Windows thường gắn MIME của Excel cho file CSV, một số trình duyệt để trống.
const TEXT_TYPES = ['', 'text/plain', 'text/csv', 'application/csv', 'application/vnd.ms-excel'];
const XLSX_TYPES = ['', XLSX_MIME, 'application/octet-stream'];

export type ImportFileErrorCode = keyof (typeof vi)['sets']['import']['file'];

/** `code` là khoá dịch ở `sets:import.file`; `message` giữ câu tiếng Việt cho log và test. */
export class ImportFileError extends Error {
  override name = 'ImportFileError';
  constructor(readonly code: ImportFileErrorCode) {
    super(vi.sets.import.file[code]);
  }
}

/** Nội dung đã đọc. File Excel được chuyển thành text ngăn bằng tab. */
export interface ImportFileContent {
  text: string;
  /** Có khi biết chắc ký tự phân cách, như với file Excel. */
  delimiter?: 'tab';
}

function checkSize(file: File) {
  if (file.size === 0) {
    throw new ImportFileError('empty');
  }
  if (file.size > IMPORT_FILE_MAX_BYTES) {
    throw new ImportFileError('tooLarge');
  }
}

/** Một ô thành text trên một dòng, để tab và xuống dòng không làm lệch cột. */
function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  return text.replace(/[\t\r\n]+/g, ' ').trim();
}

/**
 * Đọc sheet đầu tiên. Thư viện lấy giá trị Excel đã tính sẵn, không chạy công thức,
 * ô công thức không có giá trị lưu sẵn thành ô trống (ADR 0002).
 */
async function readXlsx(file: File): Promise<string> {
  if (!XLSX_TYPES.includes(file.type)) {
    throw new ImportFileError('notXlsx');
  }
  checkSize(file);
  let rows: unknown[][];
  try {
    const { readSheet } = await import('read-excel-file/browser');
    rows = await readSheet(file);
  } catch {
    throw new ImportFileError('brokenXlsx');
  }
  const text = rows
    .map((row) => row.map(cellText))
    .filter((cells) => cells.some(Boolean))
    .map((cells) => cells.join('\t'))
    .join('\n');
  if (!text) {
    throw new ImportFileError('emptySheet');
  }
  return text;
}

/** Kiểm tra file rồi đọc thành text UTF-8. Lỗi ném ra `ImportFileError` có thông báo tiếng Việt. */
export async function readImportFile(file: File): Promise<ImportFileContent> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx')) {
    return { text: await readXlsx(file), delimiter: 'tab' };
  }
  if (name.endsWith('.xls')) {
    throw new ImportFileError('oldXls');
  }
  if (!TEXT_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    throw new ImportFileError('type');
  }
  if (!TEXT_TYPES.includes(file.type)) {
    throw new ImportFileError('notText');
  }
  checkSize(file);

  const text = await file.text();
  if (text.includes('\u0000')) {
    throw new ImportFileError('encoding');
  }
  return { text };
}
