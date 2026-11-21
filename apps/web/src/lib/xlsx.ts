import { strToU8, zipSync } from 'fflate';

/**
 * Kiểu ô có sẵn trong file:
 * `header` tiêu đề cột bắt buộc, `headerOptional` tiêu đề cột không bắt buộc,
 * `title` tiêu đề đoạn, `wrap` chữ dài tự xuống dòng.
 */
export type XlsxStyle = 'header' | 'headerOptional' | 'title' | 'wrap';

/** Một ô: chuỗi, số, chữ có kiểu, hoặc công thức kèm giá trị lưu sẵn (có thể không có, dùng trong test). */
export type XlsxCell =
  | string
  | number
  | null
  | { text: string; style: XlsxStyle }
  | { formula: string; cached?: string };

export interface XlsxSheet {
  /** Tên sheet, tối đa 31 ký tự. Bỏ trống thì dùng `Sheet1`, `Sheet2`... */
  name?: string;
  rows: XlsxCell[][];
  /** Độ rộng từng cột tính theo số ký tự, theo thứ tự A, B, C... */
  widths?: number[];
  /** Cố định hàng đầu khi cuộn. */
  freezeFirstRow?: boolean;
}

// Màu lấy từ token `--primary`, `--primary-fg` và `--primary-soft` ở chế độ sáng.
const PRIMARY = 'FF5F1A9B';
const PRIMARY_FG = 'FFFFFFFF';
const PRIMARY_SOFT = 'FFF3EBFA';

/** Vị trí trong `cellXfs` của styles.xml, 0 là ô thường. */
const STYLE_INDEX: Record<XlsxStyle, number> = { header: 1, headerOptional: 2, title: 3, wrap: 4 };

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="${PRIMARY_FG}"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="${PRIMARY}"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="${PRIMARY}"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="${PRIMARY}"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="${PRIMARY_SOFT}"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf></cellXfs></styleSheet>`;

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const columnName = (index: number) => String.fromCharCode(65 + index);

const inlineString = (ref: string, text: string, style = '') =>
  `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>`;

function cellXml(cell: XlsxCell, ref: string): string {
  if (cell === null) return '';
  if (typeof cell === 'number') return `<c r="${ref}"><v>${cell}</v></c>`;
  if (typeof cell === 'string') return inlineString(ref, cell);
  if ('text' in cell) return inlineString(ref, cell.text, ` s="${STYLE_INDEX[cell.style]}"`);
  const cached = cell.cached === undefined ? '' : `<v>${escapeXml(cell.cached)}</v>`;
  return `<c r="${ref}" t="str"><f>${escapeXml(cell.formula)}</f>${cached}</c>`;
}

function sheetXml({ rows, widths, freezeFirstRow }: XlsxSheet): string {
  const views = freezeFirstRow
    ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
    : '';
  const cols = widths?.length
    ? `<cols>${widths
        .map((width, i) => `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`)
        .join('')}</cols>`
    : '';
  const data = rows
    .map(
      (row, r) =>
        `<row r="${r + 1}">${row.map((cell, c) => cellXml(cell, `${columnName(c)}${r + 1}`)).join('')}</row>`,
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${views}${cols}<sheetData>${data}</sheetData></worksheet>`;
}

/** Dựng file XLSX tối thiểu chỉ chứa chữ và số, mỗi phần tử của `sheets` là một sheet. */
export function buildXlsx(sheets: (XlsxCell[][] | XlsxSheet)[]): Uint8Array {
  const list = sheets.map((sheet) => (Array.isArray(sheet) ? { rows: sheet } : sheet));
  const names = list.map((sheet, i) => escapeXml((sheet.name ?? `Sheet${i + 1}`).slice(0, 31)));
  const styleId = `rId${list.length + 1}`;

  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${list
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
      )
      .join('')}</Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    'xl/workbook.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names
      .map((name, i) => `<sheet name="${name}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
      .join('')}</sheets></workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${list
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join(
        '',
      )}<Relationship Id="${styleId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    'xl/styles.xml': strToU8(STYLES_XML),
  };
  list.forEach((sheet, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(sheetXml(sheet));
  });
  return zipSync(files);
}
