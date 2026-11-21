import { describe, expect, it } from 'vitest';
import { importOptionsSchema } from '../schemas/import';
import { parseImport } from './parse';
import { detectTemplateHeader, IMPORT_TEMPLATE_HEADERS, IMPORT_TEMPLATE_ROWS } from './template';

const BOM = String.fromCharCode(0xfeff);

describe('detectTemplateHeader', () => {
  it('nhận ra tiêu đề file mẫu và chọn đủ 4 cột', () => {
    const content = [IMPORT_TEMPLATE_HEADERS, ...IMPORT_TEMPLATE_ROWS]
      .map((row) => row.join('\t'))
      .join('\n');

    const detected = detectTemplateHeader(content);

    expect(detected).toEqual({
      delimiter: 'tab',
      hasHeader: true,
      termColumn: 1,
      definitionColumn: 2,
      phoneticColumn: 3,
      exampleColumn: 4,
    });
    const rows = parseImport(content, importOptionsSchema.parse(detected)).rows;
    expect(rows).toHaveLength(IMPORT_TEMPLATE_ROWS.length);
    expect(rows.every(({ errors }) => errors.length === 0)).toBe(true);
  });

  it('không phân biệt hoa thường, khoảng trắng, BOM và thứ tự cột', () => {
    expect(detectTemplateHeader(`${BOM}\n  NGHĨA , từ ,  ví   dụ \nquả táo,apple,`)).toEqual({
      delimiter: 'comma',
      hasHeader: true,
      termColumn: 2,
      definitionColumn: 1,
      exampleColumn: 3,
    });
  });

  it.each([['apple\tquả táo'], ['Từ\tPhiên âm'], ['Từ\tNghĩa\tGhi chú'], ['Từ\tNghĩa\tTừ'], ['']])(
    'không coi %j là tiêu đề mẫu',
    (content) => {
      expect(detectTemplateHeader(content)).toBeNull();
    },
  );
});
