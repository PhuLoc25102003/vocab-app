import { describe, expect, it } from 'vitest';
import { getMode } from '../registry';
import './match';

const cards = [
  { id: 'c1', term: 'apple', definition: 'quả táo' },
  { id: 'c2', term: 'pear', definition: 'quả lê' },
  { id: 'c3', term: 'Học', definition: 'to learn' },
];
const answer = (value: string) => ({ questionId: 'c1', value, timeMs: 900 });

describe('MatchMode', () => {
  const mode = getMode('MATCH');

  it('mỗi thẻ là một câu, từ là câu hỏi và nghĩa là đáp án', () => {
    expect(mode.buildQuestions(cards, {})).toEqual([
      { id: 'c1', cardId: 'c1', mode: 'MATCH', prompt: 'apple', expected: 'quả táo' },
      { id: 'c2', cardId: 'c2', mode: 'MATCH', prompt: 'pear', expected: 'quả lê' },
      { id: 'c3', cardId: 'c3', mode: 'MATCH', prompt: 'Học', expected: 'to learn' },
    ]);
  });

  it('giới hạn số câu và chấp nhận danh sách rỗng', () => {
    expect(mode.buildQuestions(cards, { limit: 2 })).toHaveLength(2);
    expect(mode.buildQuestions([], {})).toEqual([]);
  });

  it('đúng khi ghép đúng nghĩa, kể cả nghĩa trùng chữ của thẻ khác', () => {
    const [question] = mode.buildQuestions(cards, {});

    expect(mode.grade(question!, answer('quả táo')).isCorrect).toBe(true);
    expect(mode.grade(question!, answer('Quả  táo ')).isCorrect).toBe(true);
    expect(mode.grade(question!, answer('quả lê'))).toEqual({
      isCorrect: false,
      expected: 'quả táo',
    });
    expect(mode.grade(question!, answer('')).isCorrect).toBe(false);
  });
});
