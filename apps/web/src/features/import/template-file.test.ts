import { detectTemplateHeader, IMPORT_TEMPLATE_HEADERS, IMPORT_TEMPLATE_ROWS } from '@vocab/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readImportFile } from './read-file';
import { buildTemplateCsv, buildTemplateFile, downloadTemplate } from './template-file';

const expectedText = [IMPORT_TEMPLATE_HEADERS, ...IMPORT_TEMPLATE_ROWS]
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

  it('CSV có BOM, tiêu đề mẫu và đọc lại được', async () => {
    const csv = buildTemplateCsv();

    expect(csv.startsWith('﻿Từ,Nghĩa,Phiên âm,Ví dụ\r\n')).toBe(true);
    const file = new File([await buildTemplateFile('csv')], 'mau.csv', { type: 'text/csv' });
    const { text } = await readImportFile(file);
    expect(detectTemplateHeader(text)).toMatchObject({ delimiter: 'comma', phoneticColumn: 3 });
  });

  it('XLSX đọc lại đúng từng ô, dấu tiếng Việt và IPA', async () => {
    const blob = await buildTemplateFile('xlsx');
    const file = new File([blob], 'mau.xlsx', { type: blob.type });

    const { text } = await readImportFile(file);

    expect(text).toBe(expectedText);
    expect(detectTemplateHeader(text)).toMatchObject({ termColumn: 1, exampleColumn: 4 });
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

    await downloadTemplate('xlsx');

    expect(createUrl).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(document.querySelector('a[download]')).toBeNull();
    vi.runAllTimers();
    expect(revokeUrl).toHaveBeenCalledWith('blob:mau');
  });
});
