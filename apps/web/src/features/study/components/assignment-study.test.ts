import { describe, expect, it } from 'vitest';
import { nextAssignmentMode } from './assignment-study';

describe('nextAssignmentMode', () => {
  const progress = [
    { mode: 'FLASHCARD' as const, done: false, score: null },
    { mode: 'MCQ' as const, done: true, score: 80 },
    { mode: 'MATCH' as const, done: false, score: null },
  ];

  it('lấy chế độ chưa xong kế tiếp theo thứ tự, rồi quay về đầu', () => {
    expect(nextAssignmentMode(progress, 'MCQ')).toBe('MATCH');
    expect(nextAssignmentMode(progress, 'MATCH')).toBe('FLASHCARD');
  });

  it('trả null khi các chế độ khác đều đã xong', () => {
    expect(nextAssignmentMode([{ mode: 'MCQ', done: true, score: 80 }], 'MCQ')).toBeNull();
    expect(
      nextAssignmentMode(
        progress.map((item) => ({ ...item, done: item.mode !== 'MATCH' })),
        'MATCH',
      ),
    ).toBeNull();
  });
});
