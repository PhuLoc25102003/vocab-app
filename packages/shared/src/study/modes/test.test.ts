import { describe, expect, it } from 'vitest';
import { getMode } from '../registry';
import { MCQ_CHOICE_COUNT } from './mcq';
import { TestMode, testQuestionKind } from './test';

const cards = Array.from({ length: 12 }, (_, index) => ({
  id: `card-${index}`,
  term: `term ${index}`,
  definition: `nghĩa ${index}`,
}));
const mode = new TestMode();
const random = () => 0.3;
const answer = (questionId: string, value: string) => ({ questionId, value, timeMs: 800 });

describe('TestMode', () => {
  it('được đăng ký', () => {
    expect(getMode('TEST')).toBeInstanceOf(TestMode);
  });

  it('mỗi thẻ một câu, có cả trắc nghiệm và gõ từ', () => {
    const questions = mode.buildQuestions(cards, { random });

    expect(questions.map(({ cardId }) => cardId)).toEqual(cards.map(({ id }) => id));
    const choice = questions.filter(({ id }) => id.endsWith(':choice'));
    const write = questions.filter(({ id }) => id.endsWith(':write'));
    expect(choice.length).toBeGreaterThan(0);
    expect(write.length).toBeGreaterThan(0);
    for (const question of choice) {
      expect(question.choices).toHaveLength(MCQ_CHOICE_COUNT);
      expect(question.choices).toContain(question.expected);
    }
    for (const question of write) {
      expect(question.choices).toBeUndefined();
      expect(question.expected).toMatch(/^term /);
    }
  });

  it('dạng câu không đổi theo thứ tự thẻ, giới hạn hay nguồn ngẫu nhiên', () => {
    const ids = new Set(mode.buildQuestions(cards, { random }).map(({ id }) => id));
    const reversed = mode.buildQuestions([...cards].reverse(), { limit: 5, random: () => 0.9 });

    expect(reversed).toHaveLength(5);
    for (const { id, cardId } of reversed) {
      expect(ids.has(id)).toBe(true);
      expect(id).toBe(`${cardId}:${testQuestionKind(cardId)}`);
    }
    expect(mode.buildQuestions([], { random })).toEqual([]);
  });

  it('chấm không phân biệt hoa thường, khoảng trắng; bỏ trống là sai', () => {
    for (const question of mode.buildQuestions(cards, { random })) {
      const value = ` ${question.expected.toUpperCase()} `;
      expect(mode.grade(question, answer(question.id, value)).isCorrect).toBe(true);
      expect(mode.grade(question, answer(question.id, '')).isCorrect).toBe(false);
    }
  });

  it('gắn imageUrl khi thẻ có ảnh minh hoạ', () => {
    const withImage = [{ ...cards[0]!, imageUrl: 'https://images.example.com/photo.jpg' }];
    const [question] = mode.buildQuestions(withImage, { random });
    expect(question?.imageUrl).toBe('https://images.example.com/photo.jpg');
  });
});
