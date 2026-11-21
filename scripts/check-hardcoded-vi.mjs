import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VI_CHAR_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

function walk(dir, fileList = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry !== 'node_modules' && entry !== '.next' && entry !== 'locales') {
        walk(fullPath, fileList);
      }
    } else if (
      fullPath.endsWith('.tsx') &&
      !fullPath.includes('.test.') &&
      !fullPath.includes('.spec.') &&
      !fullPath.endsWith('legal-content.vi.tsx') &&
      !fullPath.endsWith('legal-content.tsx') // legal-content contains the static legal articles
    ) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const targetDir = fileURLToPath(new URL('../apps/web/src', import.meta.url));
const files = walk(targetDir);
const violations = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  let inMultiComment = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (inMultiComment) {
      if (line.includes('*/')) {
        inMultiComment = false;
        line = line.substring(line.indexOf('*/') + 2).trim();
      } else {
        continue;
      }
    }

    if (line.startsWith('/*') || line.startsWith('{/*')) {
      if (line.includes('*/')) {
        line = line.substring(line.indexOf('*/') + 2).trim();
      } else {
        inMultiComment = true;
        continue;
      }
    }

    if (line.startsWith('//') || line.startsWith('*')) {
      continue;
    }

    // Strip inline single-line comments
    const inlineCommentIdx = line.indexOf('//');
    if (inlineCommentIdx !== -1) {
      line = line.substring(0, inlineCommentIdx).trim();
    }

    // Strip inline JSX comments: {/* ... */}
    line = line.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').trim();

    // Ignore brand definition and diacritic normalization
    if (
      line.includes("export const BRAND_NAME = 'Nhớ Từ'") ||
      line.includes('/đ/g') ||
      line.includes('/Đ/g')
    ) {
      continue;
    }

    if (VI_CHAR_REGEX.test(line)) {
      violations.push({
        file,
        line: i + 1,
        text: lines[i].trim(),
      });
    }
  }
}

if (violations.length > 0) {
  console.error(`Phát hiện ${violations.length} chuỗi tiếng Việt viết cứng trong .tsx:`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}: ${v.text}`);
  }
  process.exit(1);
} else {
  console.log('Không có chuỗi tiếng Việt viết cứng trong .tsx.');
}
