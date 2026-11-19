import { describe, expect, it } from 'vitest';
import { IMPORT_FILE_MAX_BYTES, readImportFile } from './read-file';

const file = (content: BlobPart, name: string, type = 'text/plain') =>
  new File([content], name, { type });

describe('readImportFile', () => {
  it('đọc file .txt và .csv thành text, giữ dấu tiếng Việt', async () => {
    await expect(readImportFile(file('học\tto learn', 'tu.txt'))).resolves.toBe('học\tto learn');
    await expect(readImportFile(file('a,b', 'tu.CSV', 'application/vnd.ms-excel'))).resolves.toBe(
      'a,b',
    );
    await expect(readImportFile(file('a,b', 'tu.csv', ''))).resolves.toBe('a,b');
  });

  it.each([
    [file('x', 'tu.xlsx'), 'Chưa đọc được file Excel'],
    [file('x', 'anh.png', 'image/png'), 'Chỉ nhận file .txt hoặc .csv.'],
    [file('x', 'gia.csv', 'application/pdf'), 'Nội dung file không phải văn bản'],
    [file('', 'trong.txt'), 'File đang trống.'],
    [file(new Uint8Array([104, 0, 105]), 'hong.txt'), 'File bị hỏng'],
  ])('từ chối file không hợp lệ (%#)', async (input, message) => {
    await expect(readImportFile(input)).rejects.toThrow(message);
  });

  it('từ chối file quá 2 MB', async () => {
    const large = file('a'.repeat(IMPORT_FILE_MAX_BYTES + 1), 'lon.txt');

    await expect(readImportFile(large)).rejects.toThrow('File tối đa 2 MB');
  });
});
