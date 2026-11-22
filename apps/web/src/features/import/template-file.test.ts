import { detectTemplateHeader, IMPORT_TEMPLATE_HEADERS, IMPORT_TEMPLATE_ROWS } from '@vocab/shared';
import { strFromU8, unzipSync } from 'fflate';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readImportFile } from './read-file';
import { buildTemplateFile, downloadTemplate } from './template-file';

const expectedText = [
  [...IMPORT_TEMPLATE_HEADERS, 'Hình ảnh'],
  ...IMPORT_TEMPLATE_ROWS.map((row) => [...row, '']),
]
  .map((row) => row.join('\t'))
  .join('\n');

const { createObjectURL, revokeObjectURL } = URL;

describe('file mẫu', () => {
  afterEach(() => {
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('XLSX đọc lại đúng từng ô, dấu tiếng Việt và IPA', async () => {
    const blob = await buildTemplateFile();
    const file = new File([blob], 'mau.xlsx', { type: blob.type });

    const { text } = await readImportFile(file);

    // Chỉ đọc sheet đầu, sheet hướng dẫn không lẫn vào dữ liệu.
    expect(text).toBe(expectedText);
    expect(detectTemplateHeader(text)).toMatchObject({ termColumn: 1, exampleColumn: 4 });
  });

  it('XLSX có sheet Từ vựng định dạng sẵn và sheet Hướng dẫn', async () => {
    const blob = await buildTemplateFile();
    const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
    const read = (path: string) => strFromU8(files[path] ?? new Uint8Array());

    expect(read('xl/workbook.xml')).toMatch(/name="Từ vựng".*name="Hướng dẫn"/);
    const words = read('xl/worksheets/sheet1.xml');
    expect(words).toContain('state="frozen"');
    expect(words).toContain('<col min="4" max="4" width="40" customWidth="1"/>');
    // Từ, Nghĩa nền đậm (kiểu 1); Phiên âm, Ví dụ nền nhạt (kiểu 2).
    expect(words).toMatch(/<c r="A1" s="1" t="inlineStr"><is><t xml:space="preserve">Từ</);
    expect(words).toMatch(/<c r="C1" s="2" t="inlineStr"><is><t xml:space="preserve">Phiên âm</);
    expect(read('xl/worksheets/sheet2.xml')).toContain('Mỗi bộ từ tối đa 2.000 thẻ');
    expect(read('xl/styles.xml')).toContain('<cellXfs count="5">');
  });

  it('tải về bằng liên kết tạm có tên file đúng định dạng', async () => {
    vi.useFakeTimers();
    const createUrl = vi.fn(() => 'blob:mau');
    const revokeUrl = vi.fn();
    URL.createObjectURL = createUrl;
    URL.revokeObjectURL = revokeUrl;
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.download).toBe('mau-nhap-tu-vung.xlsx');
      expect(this.href).toBe('blob:mau');
    });

    await downloadTemplate();

    expect(createUrl).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(document.querySelector('a[download]')).toBeNull();
    vi.runAllTimers();
    expect(revokeUrl).toHaveBeenCalledWith('blob:mau');
  });
});
