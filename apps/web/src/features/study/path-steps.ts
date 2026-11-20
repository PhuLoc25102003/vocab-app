import type { StudyMode } from '@vocab/shared';

/** Từ dễ đến khó: nhận mặt từ, chọn nghĩa, ghép nhanh, rồi tự viết lại. */
export const PATH_STEPS: { mode: StudyMode; label: string }[] = [
  { mode: 'FLASHCARD', label: 'Xem thẻ' },
  { mode: 'MCQ', label: 'Trắc nghiệm' },
  { mode: 'MATCH', label: 'Ghép cặp' },
  { mode: 'WRITE', label: 'Luyện viết' },
];

/**
 * Bước trong URL bắt đầu từ 1, giá trị lạ thì về bước đầu. Để ở module thường (không
 * `'use client'`) vì trang server gọi hàm này.
 */
export function toPathStep(value: string | undefined): number {
  const step = Number(value);
  return Number.isInteger(step) && step >= 1 && step <= PATH_STEPS.length ? step - 1 : 0;
}
