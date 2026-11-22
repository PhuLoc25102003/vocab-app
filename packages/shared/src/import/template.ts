import type { DetectedDelimiter } from '../schemas/import';
import { detectDelimiter, readFirstRecord } from './parse';

/** Hàng tiêu đề của file mẫu, theo thứ tự cột. */
export const IMPORT_TEMPLATE_HEADERS = ['Từ', 'Nghĩa', 'Phiên âm', 'Ví dụ'] as const;

/**
 * Dòng ví dụ trong file mẫu: từ đơn, cụm từ, dòng thiếu phiên âm, dòng thiếu ví dụ,
 * để người dùng thấy hai cột sau không bắt buộc.
 */
export const IMPORT_TEMPLATE_ROWS: readonly (readonly string[])[] = [
  ['apple', 'quả táo', '/ˈæp.əl/', 'I eat an apple every day.'],
  ['learn', 'học', '/lɜːn/', 'We learn English at school.'],
  ['beautiful', 'đẹp', '/ˈbjuː.tɪ.fəl/', ''],
  ['look after', 'chăm sóc', '/lʊk ˈɑːf.tər/', 'She looks after her little brother.'],
  ['homework', 'bài tập về nhà', '', 'I do my homework after dinner.'],
  ['friendly', 'thân thiện', '/ˈfrend.li/', 'My classmates are very friendly.'],
  ['take part in', 'tham gia', '', ''],
];

export interface TemplateColumns {
  delimiter: DetectedDelimiter;
  hasHeader: true;
  termColumn: number;
  definitionColumn: number;
  phoneticColumn?: number;
  exampleColumn?: number;
  imageColumn?: number;
}

const normalizeHeader = (value: string) =>
  value.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');

const HEADER_KEYS: Record<string, keyof Omit<TemplateColumns, 'delimiter' | 'hasHeader'>> = {
  [normalizeHeader('Từ')]: 'termColumn',
  [normalizeHeader('Nghĩa')]: 'definitionColumn',
  [normalizeHeader('Phiên âm')]: 'phoneticColumn',
  [normalizeHeader('Ví dụ')]: 'exampleColumn',
  [normalizeHeader('Hình ảnh')]: 'imageColumn',
  [normalizeHeader('Ảnh')]: 'imageColumn',
  [normalizeHeader('Image')]: 'imageColumn',
};

/**
 * Nếu dòng đầu là tiêu đề của file mẫu thì trả cách đọc tương ứng, cột có thể đổi thứ tự.
 * Cần có cột `Từ` và `Nghĩa`, tên cột trùng nhau hoặc lạ thì không coi là tiêu đề mẫu.
 */
export function detectTemplateHeader(content: string): TemplateColumns | null {
  const delimiter = detectDelimiter(content);
  const fields = readFirstRecord(content, delimiter);
  const found: Partial<Record<(typeof HEADER_KEYS)[string], number>> = {};
  for (const [index, field] of fields.entries()) {
    const name = normalizeHeader(field);
    if (!name) continue;
    const key = HEADER_KEYS[name];
    if (!key || found[key] !== undefined) return null;
    found[key] = index + 1;
  }
  const { termColumn, definitionColumn, phoneticColumn, exampleColumn, imageColumn } = found;
  if (termColumn === undefined || definitionColumn === undefined) return null;
  return {
    delimiter,
    hasHeader: true,
    termColumn,
    definitionColumn,
    ...(phoneticColumn === undefined ? {} : { phoneticColumn }),
    ...(exampleColumn === undefined ? {} : { exampleColumn }),
    ...(imageColumn === undefined ? {} : { imageColumn }),
  };
}
