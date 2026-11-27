import { describe, expect, it } from 'vitest';
import { getMode } from '../registry';
import type { StudyCard } from '../types';
import { WORD_RAIN_SPOKEN_PREFIX } from './word-rain';

const cards: StudyCard[] = [
  { id: 'c1', term: 'apple', definition: 'quả táo' },
  { id: 'c2', term: 'ice cream', definition: 'kem' },
  { id: 'c3', term: 'well-known', definition: 'nổi tiếng' },
];

const mode = getMode('WORD_RAIN');
const question = (index: number) => mode.buildQuestions(cards, {})[index]!;

describe('WordRainMode', () => {
  it('nghĩa là câu hỏi, từ là đáp án, giữ giới hạn số câu', () => {
    expect(mode.buildQuestions(cards, {})).toHaveLength(3);
    expect(mode.buildQuestions(cards, { limit: 2 })).toHaveLength(2);
    expect(mode.buildQuestions([], {})).toEqual([]);
    expect(question(0)).toMatchObject({ prompt: 'quả táo', expected: 'apple', mode: 'WORD_RAIN' });
  });

  it('chấm gõ như chế độ Viết: bỏ hoa thường và khoảng trắng thừa', () => {
    const answer = (value: string) => ({ questionId: 'c1', value, timeMs: 1 });
    expect(mode.grade(question(0), answer('  Apple ')).isCorrect).toBe(true);
    expect(mode.grade(question(0), answer('aple')).isCorrect).toBe(false);
    expect(mode.grade(question(1), answer('ice  cream')).isCorrect).toBe(true);
    expect(mode.grade(question(2), answer('well-known')).isCorrect).toBe(true);
  });

  it('mục tiêu chạm đáy gửi đáp án rỗng thì sai', () => {
    expect(mode.grade(question(0), { questionId: 'c1', value: '', timeMs: 1 }).isCorrect).toBe(
      false,
    );
  });

  it('chấm nói như chế độ Luyện nói khi có tiền tố', () => {
    const spoken = (value: string) => ({
      questionId: 'c2',
      value: `${WORD_RAIN_SPOKEN_PREFIX}${value}`,
      timeMs: 1,
    });
    expect(mode.grade(question(1), spoken('Ice cream')).isCorrect).toBe(true);
    expect(mode.grade(question(1), spoken('')).isCorrect).toBe(false);
  });
});
