import { strToU8, zipSync } from 'fflate';

/** Một ô: chuỗi, số, hoặc công thức kèm giá trị lưu sẵn (có thể không có, dùng trong test). */
export type XlsxCell = string | number | null | { formula: string; cached?: string };

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const columnName = (index: number) => String.fromCharCode(65 + index);

function cellXml(cell: XlsxCell, ref: string): string {
  if (cell === null) return '';
  if (typeof cell === 'number') return `<c r="${ref}"><v>${cell}</v></c>`;
  if (typeof cell === 'string') {
    return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(cell)}</t></is></c>`;
  }
  const cached = cell.cached === undefined ? '' : `<v>${escapeXml(cell.cached)}</v>`;
  return `<c r="${ref}" t="str"><f>${escapeXml(cell.formula)}</f>${cached}</c>`;
}

/** Dựng file XLSX tối thiểu chỉ chứa chữ và số, mỗi phần tử của `sheets` là một sheet. */
export function buildXlsx(sheets: XlsxCell[][][]): Uint8Array {
  const sheetXml = (rows: XlsxCell[][]) =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows
      .map(
        (row, r) =>
          `<row r="${r + 1}">${row.map((cell, c) => cellXml(cell, `${columnName(c)}${r + 1}`)).join('')}</row>`,
      )
      .join('')}</sheetData></worksheet>`;

  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
      )
      .join('')}</Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    'xl/workbook.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets
      .map((_, i) => `<sheet name="Sheet${i + 1}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
      .join('')}</sheets></workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join('')}</Relationships>`),
  };
  sheets.forEach((rows, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(sheetXml(rows));
  });
  return zipSync(files);
}
