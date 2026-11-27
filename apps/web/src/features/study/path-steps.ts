import type { StudyMode } from '@vocab/shared';

/**
 * Đi hết mọi chế độ, từ dễ đến khó: làm quen (xem thẻ), nhận ra nghĩa (trắc nghiệm, ghép cặp),
 * chuyển dần sang tự nhớ (học kỹ, luyện viết), nối âm với chữ (nghe viết), dùng từ trong câu
 * (điền từ), nói (luyện nói), kiểm tra tổng hợp, rồi kết bằng trò chơi ôn nhanh (Mưa từ).
 * Bước không dùng được với bộ từ thì tự bỏ qua. Tên bước ở `study:path.<mode>`.
 */
export const PATH_STEPS = [
  { mode: 'FLASHCARD' },
  { mode: 'MCQ' },
  { mode: 'MATCH' },
  { mode: 'LEARN' },
  { mode: 'WRITE' },
  { mode: 'DICTATION' },
  { mode: 'CLOZE' },
  { mode: 'SPEAK' },
  { mode: 'TEST' },
  { mode: 'WORD_RAIN' },
] as const satisfies readonly { mode: StudyMode }[];

/**
 * Bước trong URL bắt đầu từ 1, giá trị lạ thì về bước đầu. Để ở module thường (không
 * `'use client'`) vì trang server gọi hàm này.
 */
export function toPathStep(value: string | undefined): number {
  const step = Number(value);
  return Number.isInteger(step) && step >= 1 && step <= PATH_STEPS.length ? step - 1 : 0;
}
