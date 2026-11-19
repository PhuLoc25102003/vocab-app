import { IMPORT_TEMPLATE_HEADERS, IMPORT_TEMPLATE_ROWS } from '@vocab/shared';

export type TemplateFormat = 'xlsx' | 'csv';

const FILE_NAME = 'mau-nhap-tu-vung';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const BOM = '﻿';

const templateRows = (): string[][] => [
  [...IMPORT_TEMPLATE_HEADERS],
  ...IMPORT_TEMPLATE_ROWS.map((row) => [...row]),
];

const csvCell = (value: string) =>
  /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

/** CSV UTF-8 có BOM để Excel trên Windows mở đúng dấu tiếng Việt và IPA. */
export function buildTemplateCsv(): string {
  return `${BOM}${templateRows()
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n')}\r\n`;
}

export async function buildTemplateFile(format: TemplateFormat): Promise<Blob> {
  if (format === 'csv') {
    return new Blob([buildTemplateCsv()], { type: 'text/csv;charset=utf-8' });
  }
  // Chỉ tải phần dựng XLSX khi người dùng bấm tải file mẫu.
  const { buildXlsx } = await import('@/lib/xlsx');
  const sheet = templateRows().map((row) => row.map((cell) => cell || null));
  return new Blob([buildXlsx([sheet]) as BlobPart], { type: XLSX_MIME });
}

/** Tải file mẫu về máy bằng liên kết tạm. */
export async function downloadTemplate(format: TemplateFormat): Promise<void> {
  const url = URL.createObjectURL(await buildTemplateFile(format));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${FILE_NAME}.${format}`;
  document.body.append(link);
  link.click();
  link.remove();
  // Đợi trình duyệt bắt đầu tải rồi mới thu hồi URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
