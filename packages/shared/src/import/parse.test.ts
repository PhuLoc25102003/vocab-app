import { describe, expect, it } from 'vitest';
import { importOptionsSchema, importPreviewSchema } from '../schemas/import';
import { detectDelimiter, parseImport } from './parse';

const options = (overrides: Partial<Parameters<typeof parseImport>[1]> = {}) =>
  importOptionsSchema.parse(overrides);

describe('detectDelimiter', () => {
  it.each([
    ['apple\tquả táo\ncat\tcon mèo', 'tab'],
    ['apple;quả táo\ncat;con mèo, mèo', 'semicolon'],
    ['apple,quả táo\ncat,con mèo', 'comma'],
    ['apple - quả táo\ncat - con mèo, mèo nhà\ndog - con chó', 'dash'],
  ])('nhận ra ký tự phân cách của %j', (content, expected) => {
    expect(detectDelimiter(content)).toBe(expected);
  });

  it('ưu tiên tab khi số dòng bằng nhau', () => {
    expect(detectDelimiter('a\tb, c\nd\te, f')).toBe('tab');
  });
});

describe('parseImport', () => {
  it('đọc text dán từ Quizlet, bỏ dòng trống và giữ số dòng gốc', () => {
    const result = parseImport('apple\tquả táo\n\n  \ncat\tcon mèo\n', options());

    expect(result).toEqual({
      delimiter: 'tab',
      columnCount: 2,
      rows: [
        { line: 1, term: 'apple', definition: 'quả táo', errors: [] },
        { line: 4, term: 'cat', definition: 'con mèo', errors: [] },
      ],
    });
  });

  it('bỏ BOM, chuẩn hoá xuống dòng Windows và giữ dấu tiếng Việt', () => {
    const bom = String.fromCharCode(0xfeff);
    const result = parseImport(
      `${bom}word,nghĩa\r\nhọc,to learn\r\n`,
      options({ hasHeader: true }),
    );

    expect(result.rows).toEqual([{ line: 2, term: 'học', definition: 'to learn', errors: [] }]);
  });

  it('đọc ô CSV có ngoặc kép chứa dấu phẩy, ngoặc kép và xuống dòng', () => {
    const csv = 'run,"chạy, điều hành"\nsay,"nói ""xin chào"""\nlong,"dòng 1\ndòng 2"\nlast,cuối';
    const result = parseImport(csv, options({ delimiter: 'comma' }));

    expect(result.rows.map(({ line, definition }) => [line, definition])).toEqual([
      [1, 'chạy, điều hành'],
      [2, 'nói "xin chào"'],
      [3, 'dòng 1\ndòng 2'],
      [5, 'cuối'],
    ]);
  });

  it('chọn cột từ và cột nghĩa bất kỳ', () => {
    const result = parseImport(
      'STT;Nghĩa;Từ\n1;quả táo;apple',
      options({ delimiter: 'semicolon', hasHeader: true, termColumn: 3, definitionColumn: 2 }),
    );

    expect(result.columnCount).toBe(3);
    expect(result.rows[0]).toMatchObject({ term: 'apple', definition: 'quả táo', errors: [] });
  });

  it('báo lỗi từng dòng thiếu nghĩa, thiếu từ hoặc quá dài', () => {
    const result = parseImport(`chỉ có từ\n\tchỉ có nghĩa\n${'a'.repeat(201)}\tdài quá`, options());

    expect(result.rows.map(({ errors }) => errors)).toEqual([
      ['Hãy nhập định nghĩa'],
      ['Hãy nhập thuật ngữ'],
      ['thuật ngữ tối đa 200 ký tự'],
    ]);
  });

  it('giữ công thức Excel ở dạng văn bản', () => {
    const result = parseImport('=SUM(A1:A2),"=HYPERLINK(""x"")"', options({ delimiter: 'comma' }));

    expect(result.rows[0]).toMatchObject({ term: '=SUM(A1:A2)', definition: '=HYPERLINK("x")' });
  });

  it('đọc cột phiên âm và ví dụ khi được chọn, ô trống không phải lỗi', () => {
    const result = parseImport(
      'apple\tquả táo\t/ˈæp.əl/\tI eat an apple.\ncat\tcon mèo\t\t\ndog\tcon chó',
      options({ phoneticColumn: 3, exampleColumn: 4 }),
    );

    expect(result.rows).toEqual([
      {
        line: 1,
        term: 'apple',
        definition: 'quả táo',
        phonetic: '/ˈæp.əl/',
        example: 'I eat an apple.',
        errors: [],
      },
      { line: 2, term: 'cat', definition: 'con mèo', phonetic: '', example: '', errors: [] },
      { line: 3, term: 'dog', definition: 'con chó', phonetic: '', example: '', errors: [] },
    ]);
  });

  it('không chọn cột phiên âm, ví dụ thì dòng không có hai trường đó', () => {
    const [row] = parseImport('apple\tquả táo\t/ˈæp.əl/', options()).rows;

    expect(row).not.toHaveProperty('phonetic');
    expect(row).not.toHaveProperty('example');
  });

  it('báo lỗi phiên âm, ví dụ quá dài', () => {
    const result = parseImport(
      `apple\tquả táo\t${'a'.repeat(201)}\t${'b'.repeat(1001)}`,
      options({ phoneticColumn: 3, exampleColumn: 4 }),
    );

    expect(result.rows[0]?.errors).toEqual([
      'phiên âm tối đa 200 ký tự',
      'ví dụ tối đa 1000 ký tự',
    ]);
  });

  it('dòng chỉ có ký tự phân cách bị bỏ qua', () => {
    expect(parseImport(';;\napple;táo', options({ delimiter: 'semicolon' })).rows).toHaveLength(1);
  });
});

describe('importPreviewSchema', () => {
  it('từ chối nội dung rỗng và cột trùng nhau', () => {
    expect(importPreviewSchema.safeParse({ content: '   ' }).success).toBe(false);
    expect(
      importPreviewSchema.safeParse({
        content: 'a\tb',
        options: { termColumn: 2, definitionColumn: 2 },
      }).success,
    ).toBe(false);
  });

  it('cột phiên âm, ví dụ phải khác các cột khác, giá trị rỗng là không chọn', () => {
    const parse = (extra: object) =>
      importOptionsSchema.safeParse({ termColumn: 1, definitionColumn: 2, ...extra });

    expect(parse({ phoneticColumn: 2 }).error?.issues).toMatchObject([
      { path: ['phoneticColumn'], message: 'Cột phiên âm phải khác cột từ và cột nghĩa' },
    ]);
    expect(parse({ phoneticColumn: 3, exampleColumn: 3 }).error?.issues).toMatchObject([
      { path: ['exampleColumn'], message: 'Cột ví dụ phải khác các cột đã chọn' },
    ]);
    expect(parse({ phoneticColumn: '', exampleColumn: '4' }).data).toMatchObject({
      phoneticColumn: undefined,
      exampleColumn: 4,
    });
  });

  it('áp giá trị mặc định cho tuỳ chọn', () => {
    expect(importPreviewSchema.parse({ content: 'a\tb' }).options).toEqual({
      delimiter: 'auto',
      hasHeader: false,
      termColumn: 1,
      definitionColumn: 2,
    });
  });
});
