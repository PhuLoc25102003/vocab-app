import type {
  DetectedDelimiter,
  ImportOptions,
  ImportPreviewResult,
  ImportRow,
} from '../schemas/import';
import { cardInputSchema } from '../schemas/set';

const DELIMITERS: Record<DetectedDelimiter, string> = {
  tab: '\t',
  semicolon: ';',
  comma: ',',
  dash: ' - ',
};

/** Thứ tự ưu tiên khi hai ký tự xuất hiện ở số dòng bằng nhau. */
const DETECT_ORDER: DetectedDelimiter[] = ['tab', 'semicolon', 'comma', 'dash'];
const DETECT_SAMPLE_LINES = 50;
const BOM = String.fromCharCode(0xfeff);

interface RawRecord {
  line: number;
  fields: string[];
}

/** Bỏ BOM và đưa mọi kiểu xuống dòng về `\n`. */
function normalize(content: string): string {
  const withoutBom = content.startsWith(BOM) ? content.slice(1) : content;
  return withoutBom.replace(/\r\n?/g, '\n');
}

export function detectDelimiter(content: string): DetectedDelimiter {
  const sample = normalize(content)
    .split('\n')
    .filter((line) => line.trim())
    .slice(0, DETECT_SAMPLE_LINES);
  let best: DetectedDelimiter = 'tab';
  let bestCount = 0;
  for (const name of DETECT_ORDER) {
    const count = sample.filter((line) => line.includes(DELIMITERS[name])).length;
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Tách nội dung thành các dòng và cột theo quy tắc CSV:
 * ô bắt đầu bằng ngoặc kép có thể chứa ký tự phân cách và xuống dòng, `""` là một dấu ngoặc kép.
 */
function tokenize(content: string, delimiter: string): RawRecord[] {
  const records: RawRecord[] = [];
  let fields: string[] = [];
  let field = '';
  let quoted = false;
  let inQuotes = false;
  let line = 1;
  let recordLine = 1;

  const endField = () => {
    fields.push(quoted ? field : field.trim());
    field = '';
    quoted = false;
  };

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    if (inQuotes) {
      if (char === '"' && content[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        if (char === '\n') line += 1;
        field += char;
      }
    } else if (char === '"' && !quoted && field.trim() === '') {
      field = '';
      quoted = true;
      inQuotes = true;
    } else if (content.startsWith(delimiter, index)) {
      endField();
      index += delimiter.length - 1;
    } else if (char === '\n') {
      endField();
      records.push({ line: recordLine, fields });
      fields = [];
      line += 1;
      recordLine = line;
    } else if (!quoted) {
      field += char;
    }
  }
  if (field || quoted || fields.length > 0) {
    endField();
    records.push({ line: recordLine, fields });
  }
  return records;
}

/** Các ô của dòng có nội dung đầu tiên, dùng để nhận diện hàng tiêu đề. */
export function readFirstRecord(content: string, delimiter: DetectedDelimiter): string[] {
  const record = tokenize(normalize(content), DELIMITERS[delimiter]).find(({ fields }) =>
    fields.some((value) => value.trim()),
  );
  return record?.fields ?? [];
}

/**
 * Đọc text hoặc CSV thành danh sách thẻ, mỗi dòng kèm lỗi nếu có.
 * Phiên âm và ví dụ chỉ có trong dòng khi chọn cột, ô trống không phải lỗi.
 */
export function parseImport(content: string, options: ImportOptions): ImportPreviewResult {
  const normalized = normalize(content);
  const delimiter = options.delimiter === 'auto' ? detectDelimiter(normalized) : options.delimiter;
  const records = tokenize(normalized, DELIMITERS[delimiter])
    .filter(({ fields }) => fields.some((value) => value.trim()))
    .slice(options.hasHeader ? 1 : 0);

  const cell = (fields: string[], column: number) => (fields[column - 1] ?? '').trim();
  const rows = records.map(({ line, fields }) => {
    const term = cell(fields, options.termColumn);
    const definition = cell(fields, options.definitionColumn);
    const optional: Pick<ImportRow, 'phonetic' | 'example'> = {};
    if (options.phoneticColumn !== undefined) {
      optional.phonetic = cell(fields, options.phoneticColumn);
    }
    if (options.exampleColumn !== undefined) {
      optional.example = cell(fields, options.exampleColumn);
    }
    const result = cardInputSchema.safeParse({
      term,
      definition,
      phonetic: optional.phonetic || undefined,
      example: optional.example || undefined,
    });
    // Mỗi ô chỉ báo lỗi đầu tiên để người dùng dễ đọc.
    const errors: string[] = [];
    const seen = new Set<string>();
    for (const issue of result.success ? [] : result.error.issues) {
      const field = String(issue.path[0]);
      if (!seen.has(field)) {
        seen.add(field);
        errors.push(issue.message);
      }
    }
    return { line, term, definition, ...optional, errors };
  });

  return {
    delimiter,
    columnCount: records.reduce((max, { fields }) => Math.max(max, fields.length), 0),
    rows,
  };
}
