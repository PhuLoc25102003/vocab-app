#!/usr/bin/env node
/**
 * Tính lại bảng "Tổng quan" trong docs/07-progress.md từ các dấu [x] / [ ] của từng giai đoạn.
 * PR của một việc chỉ sửa dòng của việc đó; bảng được đồng bộ bằng lệnh này để các PR song song
 * không đè lên cùng một dòng.
 *
 *   node scripts/progress.mjs          ghi lại file
 *   node scripts/progress.mjs --check  chỉ báo lệch, thoát mã 1 nếu bảng chưa khớp
 */
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../docs/07-progress.md', import.meta.url);
const check = process.argv.includes('--check');
const text = readFileSync(FILE, 'utf8');
const eol = text.includes('\r\n') ? '\r\n' : '\n';
const lines = text.split(/\r?\n/);

/** Đếm việc theo giai đoạn: mỗi dòng `- [x] **5.14**` thuộc giai đoạn 5. */
const counts = new Map();
for (const line of lines) {
  const match = /^- \[( |x)\] \*\*(\d+)\.\d+[a-z]?\*\*/.exec(line);
  if (!match) continue;
  const phase = match[2];
  const entry = counts.get(phase) ?? { done: 0, total: 0 };
  entry.total += 1;
  if (match[1] === 'x') entry.done += 1;
  counts.set(phase, entry);
}

const status = ({ done, total }) =>
  done === total ? 'Xong' : done === 0 ? 'Chưa làm' : 'Đang làm';
let sumDone = 0;
let sumTotal = 0;
let changed = false;

const next = lines.map((line) => {
  const row = /^\|\s*(\d+)\.\s[^|]*\|[^|]*\|/.exec(line);
  if (row) {
    const entry = counts.get(row[1]);
    if (!entry) return line;
    sumDone += entry.done;
    sumTotal += entry.total;
    const cells = line.split('|');
    // | tên | mục tiêu | xong | tổng | trạng thái |
    cells[3] = ` ${entry.done} `;
    cells[4] = ` ${entry.total} `;
    cells[5] = ` ${status(entry)} `;
    const updated = cells.join('|');
    if (updated.replace(/\s+/g, ' ') !== line.replace(/\s+/g, ' ')) changed = true;
    return updated;
  }
  if (/^\|\s*\*\*Toàn dự án\*\*/.test(line)) {
    const percent = sumTotal ? Math.round((sumDone / sumTotal) * 100) : 0;
    const cells = line.split('|');
    cells[3] = ` **${sumDone}** `;
    cells[4] = ` **${sumTotal}** `;
    cells[5] = ` **${percent}%** `;
    const updated = cells.join('|');
    if (updated.replace(/\s+/g, ' ') !== line.replace(/\s+/g, ' ')) changed = true;
    return updated;
  }
  return line;
});

if (check) {
  if (changed) {
    console.error('Bảng tổng quan trong docs/07-progress.md chưa khớp. Chạy: npm run progress');
    process.exit(1);
  }
  console.log('Bảng tổng quan đã khớp.');
} else {
  writeFileSync(FILE, next.join(eol));
  console.log(changed ? 'Đã cập nhật bảng tổng quan.' : 'Bảng tổng quan đã khớp.');
}
