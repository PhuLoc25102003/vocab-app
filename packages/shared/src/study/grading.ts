import type { GradeResult } from './types';

const CURLY_APOSTROPHES = /[‘’]/g;
const WHITESPACE_RUN = /\s+/g;

/**
 * Đưa đáp án về một dạng để so sánh. Không dùng `toLocaleLowerCase` vì kết quả phụ
 * thuộc ngôn ngữ của máy, web và API có thể chấm khác nhau. Dấu tiếng Việt được giữ
 * nguyên, NFC chỉ gộp các cách gõ khác nhau của cùng một chữ.
 */
export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFC')
    .replace(CURLY_APOSTROPHES, "'")
    .replace(WHITESPACE_RUN, ' ')
    .trim();
}

export function gradeText(expected: string, value: string): GradeResult {
  const answer = normalizeAnswer(value);
  return {
    isCorrect: answer.length > 0 && answer === normalizeAnswer(expected),
    expected,
  };
}

/** Tính khoảng cách Damerau-Levenshtein giữa hai chuỗi (hỗ trợ cả hoán vị ký tự liền kề như er <-> re) */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const d: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    d[0]![j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i]![j] = Math.min(
        d[i - 1]![j]! + 1, // deletion
        d[i]![j - 1]! + 1, // insertion
        d[i - 1]![j - 1]! + cost, // substitution
      );
      // Damerau transposition (hoán vị 2 ký tự liền nhau)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i]![j] = Math.min(d[i]![j]!, d[i - 2]![j - 2]! + 1);
      }
    }
  }
  return d[a.length]![b.length]!;
}

/**
 * Chuẩn hoá văn bản thu âm cho luyện nói:
 * - Bỏ mọi dấu chấm câu cuối câu (. , ! ? : ; " ' - ~) do bộ nhận diện giọng nói tự gán
 * - Chuyển chữ thường, NFC, gộp khoảng trắng
 */
export function normalizeSpokenText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFC')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'“”‘’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tách các phương án hợp lệ từ expected (xử lý ngoặc đơn, gạch chéo) */
export function extractSpokenCandidates(expected: string): string[] {
  const norm = normalizeSpokenText(expected);
  const candidates = new Set<string>();
  if (norm) {
    candidates.add(norm);
  }

  // Tách theo gạch chéo "autumn / fall" -> ["autumn", "fall"]
  if (expected.includes('/')) {
    expected.split('/').forEach((part) => {
      const clean = normalizeSpokenText(part);
      if (clean) candidates.add(clean);
    });
  }

  // Tách cụm trong ngoặc: "(to) swim" -> "swim", "to swim"; "autumn (fall)" -> "autumn", "fall"
  const withoutParens = expected.replace(/\([^)]*\)/g, ' ').trim();
  const cleanWithout = normalizeSpokenText(withoutParens);
  if (cleanWithout) {
    candidates.add(cleanWithout);
  }

  const parenMatches = expected.match(/\(([^)]+)\)/g);
  if (parenMatches) {
    for (const match of parenMatches) {
      const inside = normalizeSpokenText(match.slice(1, -1));
      if (inside) candidates.add(inside);
    }
  }

  return Array.from(candidates);
}

/**
 * Chấm điểm bài nói với độ chịu lỗi âm học thực tế (Acoustic Tolerance):
 * 1. Khớp chính xác với từ gốc hoặc phương án trích xuất (ngoặc, gạch chéo).
 * 2. Khớp cụm từ: Người nói nói cả cụm hoặc mạo từ ("an apple", "the cat") mà từ đích nằm trọn vẹn trong đó.
 * 3. Dung sai ngữ âm (Levenshtein distance <= 1-2 hoặc sai biệt chính tả Anh-Anh / Anh-Mỹ như theatre/theater, color/colour).
 */
export function gradeSpokenText(expected: string, value: string): GradeResult {
  const spoken = normalizeSpokenText(value);
  if (!spoken) {
    return { isCorrect: false, expected };
  }

  const candidates = extractSpokenCandidates(expected);
  if (candidates.length === 0) {
    return { isCorrect: false, expected };
  }

  for (const cand of candidates) {
    // 1. Khớp tuyệt đối sau chuẩn hoá
    if (spoken === cand) {
      return { isCorrect: true, expected };
    }

    // 2. Chứa từ đích trọn vẹn (Token containment) - ví dụ "an apple" cho "apple"
    const spokenTokens = spoken.split(' ');
    const candTokens = cand.split(' ');
    if (candTokens.length === 1 && spokenTokens.includes(cand)) {
      return { isCorrect: true, expected };
    }
    if (candTokens.length > 1 && spoken.includes(cand)) {
      return { isCorrect: true, expected };
    }

    // Không đánh đồng số ít và số nhiều (ví dụ apple vs apples, cat vs cats, box vs boxes)
    if (
      spoken === `${cand}s` ||
      spoken === `${cand}es` ||
      cand === `${spoken}s` ||
      cand === `${spoken}es`
    ) {
      continue;
    }

    // 3. Dung sai gõ máy / nhận diện ngữ âm (Fuzzy match)
    const dist = levenshteinDistance(spoken, cand);
    const maxLen = Math.max(spoken.length, cand.length);
    // Từ ngắn (4-5 ký tự): cho phép sai lệch tối đa 1 ký tự
    if (maxLen >= 4 && maxLen <= 5 && dist <= 1) {
      return { isCorrect: true, expected };
    }
    // Từ trung bình và dài (>= 6 ký tự): cho phép sai lệch 2 ký tự (hoán vị hoặc 80% độ tương đồng)
    if (maxLen >= 6 && (dist <= 2 || (maxLen - dist) / maxLen >= 0.78)) {
      return { isCorrect: true, expected };
    }
  }

  return { isCorrect: false, expected };
}
