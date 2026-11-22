import { describe, expect, it } from 'vitest';
import { getMode } from '../registry';
import { CLOZE_BLANK, makeCloze } from './cloze';

const cards = [
  { id: 'c1', term: 'apple', definition: 'quả táo', example: 'I eat an apple every day.' },
  { id: 'c2', term: 'cat', definition: 'con mèo', example: 'This category is new.' },
  { id: 'c3', term: 'dog', definition: 'con chó', example: null },
  { id: 'c4', term: 'run', definition: 'chạy', example: 'Run! I run fast.' },
];
const answer = (value: string) => ({ questionId: 'c1', value, timeMs: 1000 });

describe('makeCloze', () => {
  it('thay mọi lần xuất hiện của nguyên từ, không phân biệt hoa thường', () => {
    expect(makeCloze('Run! I run fast.', 'run')).toBe(`${CLOZE_BLANK}! I ${CLOZE_BLANK} fast.`);
  });

  it('không khớp một phần của từ khác', () => {
    expect(makeCloze('This category is new.', 'cat')).toBeNull();
  });

  it('khớp cụm từ, từ có dấu tiếng Việt và ký tự đặc biệt', () => {
    expect(makeCloze('Please look after my cat.', 'look after')).toBe(
      `Please ${CLOZE_BLANK} my cat.`,
    );
    expect(makeCloze('Tôi đi học mỗi ngày.', 'học')).toBe(`Tôi đi ${CLOZE_BLANK} mỗi ngày.`);
    expect(makeCloze('I use C++ daily.', 'C++')).toBe(`I use ${CLOZE_BLANK} daily.`);
    expect(makeCloze('Họ học hỏi.', 'học h')).toBeNull();
  });

  it('từ rỗng thì không tạo chỗ trống', () => {
    expect(makeCloze('Some text', '  ')).toBeNull();
  });
});

describe('ClozeMode', () => {
  const mode = getMode('CLOZE');

  it('chỉ tạo câu cho thẻ có ví dụ chứa từ, kèm nghĩa làm gợi ý', () => {
    expect(mode.buildQuestions(cards, {})).toEqual([
      {
        id: 'c1',
        cardId: 'c1',
        mode: 'CLOZE',
        prompt: `I eat an ${CLOZE_BLANK} every day.`,
        expected: 'apple',
        hint: 'quả táo',
      },
      expect.objectContaining({ id: 'c4', expected: 'run' }),
    ]);
  });

  it('giới hạn số câu sau khi lọc và trả rỗng khi không có thẻ phù hợp', () => {
    expect(mode.buildQuestions(cards, { limit: 1 }).map(({ id }) => id)).toEqual(['c1']);
    expect(mode.buildQuestions([cards[2]!], {})).toEqual([]);
    expect(mode.buildQuestions([], {})).toEqual([]);
  });

  it('chấm như chế độ Viết', () => {
    const [question] = mode.buildQuestions(cards, {});

    expect(mode.grade(question!, answer(' Apple ')).isCorrect).toBe(true);
    expect(mode.grade(question!, answer('apples'))).toEqual({
      isCorrect: false,
      expected: 'apple',
    });
  });

  it('gắn imageUrl khi thẻ có ảnh', () => {
    const [question] = mode.buildQuestions(
      [{ ...cards[0]!, imageUrl: 'https://images.unsplash.com/photo-1' }],
      {},
    );
    expect(question?.imageUrl).toBe('https://images.unsplash.com/photo-1');
  });
});
