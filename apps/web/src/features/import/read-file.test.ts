import { describe, expect, it } from 'vitest';
import { buildXlsx, type XlsxCell } from '@/test/build-xlsx';
import { IMPORT_FILE_MAX_BYTES, readImportFile } from './read-file';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const file = (content: BlobPart, name: string, type = 'text/plain') =>
  new File([content], name, { type });

const xlsx = (sheets: XlsxCell[][][], type = XLSX_MIME) =>
  new File([buildXlsx(sheets) as BlobPart], 'tu.xlsx', { type });

describe('readImportFile', () => {
  it('đọc file .txt và .csv thành text, giữ dấu tiếng Việt', async () => {
    await expect(readImportFile(file('học\tto learn', 'tu.txt'))).resolves.toEqual({
      text: 'học\tto learn',
    });
    await expect(
      readImportFile(file('a,b', 'tu.CSV', 'application/vnd.ms-excel')),
    ).resolves.toEqual({ text: 'a,b' });
    await expect(readImportFile(file('a,b', 'tu.csv', ''))).resolves.toEqual({ text: 'a,b' });
  });

  it('đọc sheet đầu tiên của file .xlsx thành text ngăn bằng tab, giữ dấu và IPA', async () => {
    const input = xlsx([
      [
        ['Từ', 'Nghĩa', 'Phiên âm', 'Ví dụ'],
        ['apple', 'quả táo', '/ˈæp.əl/', 'I eat\tan apple.\nEvery day.'],
        [null, null, null, null],
        ['học', 'to learn', null, 7],
      ],
      [['sheet', 'thứ hai']],
    ]);

    await expect(readImportFile(input)).resolves.toEqual({
      text: 'Từ\tNghĩa\tPhiên âm\tVí dụ\napple\tquả táo\t/ˈæp.əl/\tI eat an apple. Every day.\nhọc\tto learn\t\t7',
      delimiter: 'tab',
    });
  });

  it('ô công thức lấy giá trị lưu sẵn, không có giá trị thì để trống', async () => {
    const input = xlsx(
      [
        [
          ['cat', { formula: 'CONCAT("con ","mèo")', cached: 'con mèo' }],
          ['dog', { formula: 'HYPERLINK("http://x","y")' }],
        ],
      ],
      '',
    );

    await expect(readImportFile(input)).resolves.toMatchObject({ text: 'cat\tcon mèo\ndog\t' });
  });

  it.each([
    [file('x', 'tu.xls', 'application/vnd.ms-excel'), 'Chưa đọc được file .xls cũ'],
    [file('x', 'hong.xlsx', XLSX_MIME), 'File Excel bị hỏng'],
    [file('x', 'gia.xlsx', 'text/plain'), 'Nội dung file không phải Excel'],
    [file('', 'trong.xlsx', XLSX_MIME), 'File đang trống.'],
    [file('x', 'anh.png', 'image/png'), 'Chỉ nhận file .txt, .csv hoặc .xlsx.'],
    [file('x', 'gia.csv', 'application/pdf'), 'Nội dung file không phải văn bản'],
    [file('', 'trong.txt'), 'File đang trống.'],
    [file(new Uint8Array([104, 0, 105]), 'hong.txt'), 'File bị hỏng'],
  ])('từ chối file không hợp lệ (%#)', async (input, message) => {
    await expect(readImportFile(input)).rejects.toThrow(message);
  });

  it('từ chối sheet đầu tiên trống', async () => {
    await expect(readImportFile(xlsx([[[null, '  ']]]))).rejects.toThrow(
      'Sheet đầu tiên của file Excel đang trống.',
    );
  });

  it('từ chối file quá 2 MB, kể cả file Excel', async () => {
    const large = 'a'.repeat(IMPORT_FILE_MAX_BYTES + 1);

    await expect(readImportFile(file(large, 'lon.txt'))).rejects.toThrow('File tối đa 2 MB');
    await expect(readImportFile(file(large, 'lon.xlsx', XLSX_MIME))).rejects.toThrow(
      'File tối đa 2 MB',
    );
  });
});
