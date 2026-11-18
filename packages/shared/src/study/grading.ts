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
