import { describe, expect, it } from 'vitest';
import { getMode } from '../registry';
import { SpeakMode } from './speak';

const cards = [
  { id: 'c1', term: 'apple', definition: 'quả táo' },
  { id: 'c2', term: 'ice cream', definition: 'kem' },
];
const mode = new SpeakMode();
const answer = (value: string) => ({ questionId: 'c1', value, timeMs: 900 });

describe('SpeakMode', () => {
  it('được đăng ký', () => {
    expect(getMode('SPEAK')).toBeInstanceOf(SpeakMode);
  });

  it('mỗi thẻ một câu đọc từ, nghĩa làm gợi ý, có giới hạn', () => {
    expect(mode.buildQuestions(cards, {})).toEqual([
      {
        id: 'c1',
        cardId: 'c1',
        mode: 'SPEAK',
        prompt: 'apple',
        expected: 'apple',
        hint: 'quả táo',
      },
      {
        id: 'c2',
        cardId: 'c2',
        mode: 'SPEAK',
        prompt: 'ice cream',
        expected: 'ice cream',
        hint: 'kem',
      },
    ]);
    expect(mode.buildQuestions(cards, { limit: 1 })).toHaveLength(1);
    expect(mode.buildQuestions([], {})).toEqual([]);
  });

  it('chấm câu nhận dạng không phân biệt hoa thường, khoảng trắng; bỏ qua là sai', () => {
    const [question] = mode.buildQuestions(cards, {});

    expect(mode.grade(question!, answer(' Apple ')).isCorrect).toBe(true);
    expect(mode.grade(question!, answer('apples')).isCorrect).toBe(false);
    expect(mode.grade(question!, answer('')).isCorrect).toBe(false);
  });

  it('gắn imageUrl khi thẻ có ảnh minh hoạ', () => {
    const withImage = [{ ...cards[0]!, imageUrl: 'https://images.example.com/apple.jpg' }];
    const [question] = mode.buildQuestions(withImage, {});
    expect(question?.imageUrl).toBe('https://images.example.com/apple.jpg');
  });
});
