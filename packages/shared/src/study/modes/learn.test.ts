import { describe, expect, it } from 'vitest';
import { getMode } from '../registry';
import type { StudyCard } from '../types';
import { LearnMode, learnLevel } from './learn';
import { MCQ_CHOICE_COUNT } from './mcq';

const words = ['một', 'hai', 'ba', 'bốn', 'năm'];
const cards: StudyCard[] = words.map((definition, index) => ({
  id: `c${index}`,
  term: `term ${index}`,
  definition,
}));
const mode = new LearnMode();
const random = () => 0.42;
const answer = (questionId: string, value: string) => ({ questionId, value, timeMs: 500 });

describe('LearnMode', () => {
  it('được đăng ký', () => {
    expect(getMode('LEARN')).toBeInstanceOf(LearnMode);
  });

  it('thẻ chưa có mức nhớ hỏi trắc nghiệm trước, gõ từ sau', () => {
    const questions = mode.buildQuestions(cards.slice(0, 2), { random });

    expect(questions.map(({ id }) => id)).toEqual([
      'c0:choice',
      'c1:choice',
      'c0:write',
      'c1:write',
    ]);
    const [choice, , write] = questions;
    expect(choice).toMatchObject({
      cardId: 'c0',
      mode: 'LEARN',
      prompt: 'term 0',
      expected: 'một',
    });
    expect(choice?.choices).toContain('một');
    expect(write).toMatchObject({ cardId: 'c0', prompt: 'một', expected: 'term 0' });
    expect(write?.choices).toBeUndefined();
  });

  it('thẻ đã thuộc chỉ hỏi gõ từ, đáp án nhiễu vẫn lấy từ mọi thẻ', () => {
    const leveled = cards.map((card, index) => ({
      ...card,
      level: index === 0 ? ('new' as const) : ('known' as const),
    }));

    const questions = mode.buildQuestions(leveled, { random });

    expect(questions.filter(({ choices }) => choices)).toHaveLength(1);
    expect(questions[0]?.choices).toHaveLength(MCQ_CHOICE_COUNT);
    expect(questions.filter(({ id }) => id.endsWith(':write'))).toHaveLength(cards.length);
  });

  it('giới hạn theo số thẻ và trả rỗng khi không có thẻ', () => {
    expect(mode.buildQuestions(cards, { limit: 1, random })).toHaveLength(2);
    expect(mode.buildQuestions([], { random })).toEqual([]);
  });

  it('dựng lại không kèm mức nhớ thì có đủ mọi câu đã ra khi có mức nhớ', () => {
    const leveled = cards.map((card) => ({ ...card, level: 'known' as const }));
    const all = new Set(mode.buildQuestions(cards, { random }).map(({ id }) => id));

    for (const { id } of mode.buildQuestions(leveled, { random })) {
      expect(all.has(id)).toBe(true);
    }
  });

  it('chấm không phân biệt hoa thường, khoảng trắng và giữ dấu tiếng Việt', () => {
    const [choice, , , , , write] = mode.buildQuestions(cards, { random });

    expect(mode.grade(choice!, answer(choice!.id, 'một')).isCorrect).toBe(true);
    expect(mode.grade(choice!, answer(choice!.id, 'mot')).isCorrect).toBe(false);
    expect(mode.grade(write!, answer(write!.id, '  TERM 0 ')).isCorrect).toBe(true);
    expect(mode.grade(write!, answer(write!.id, '')).isCorrect).toBe(false);
  });
});

describe('learnLevel', () => {
  it.each([
    [null, 'new'],
    [{ reps: 0, lastResult: null }, 'new'],
    [{ reps: 3, lastResult: false }, 'new'],
    [{ reps: 1, lastResult: true }, 'known'],
  ] as const)('%j là %s', (progress, level) => {
    expect(learnLevel(progress)).toBe(level);
  });
});
