import { describe, expect, it } from 'vitest';
import { gradeSpokenText, gradeText, normalizeAnswer } from './grading';

describe('normalizeAnswer', () => {
  it('lowercases, trims and collapses whitespace', () => {
    expect(normalizeAnswer('  Give\t  UP\n')).toBe('give up');
  });

  it('treats non-breaking spaces as spaces', () => {
    expect(normalizeAnswer('give up')).toBe('give up');
  });

  it('unifies curly apostrophes', () => {
    expect(normalizeAnswer('don’t')).toBe("don't");
  });

  it('unifies composed and decomposed Vietnamese', () => {
    expect(normalizeAnswer('Việt')).toBe(normalizeAnswer('Việt'));
  });
});

describe('gradeText', () => {
  it('accepts an exact answer and returns the original expected text', () => {
    expect(gradeText('Give Up', 'give up')).toEqual({ isCorrect: true, expected: 'Give Up' });
  });

  it('rejects a different answer', () => {
    expect(gradeText('apple', 'apples').isCorrect).toBe(false);
  });

  it('rejects a Vietnamese answer with the wrong tone mark', () => {
    expect(gradeText('má', 'mà').isCorrect).toBe(false);
  });

  it('rejects a Vietnamese answer without tone marks', () => {
    expect(gradeText('tiếng Việt', 'tieng viet').isCorrect).toBe(false);
  });

  it('does not require punctuation or symbols missing from the keyboard', () => {
    expect(gradeText("o'clock", 'oclock').isCorrect).toBe(true);
    expect(gradeText('e-mail', 'email').isCorrect).toBe(true);
    expect(gradeText('well-known', 'well known').isCorrect).toBe(true);
    expect(gradeText('U.S.A.', 'usa').isCorrect).toBe(true);
    expect(gradeText('wait…', 'wait').isCorrect).toBe(true);
    expect(gradeText('rock ‘n’ roll', "rock 'n' roll").isCorrect).toBe(true);
    expect(gradeText('ice cream', 'icecream').isCorrect).toBe(false);
  });

  it('folds foreign Latin letters but keeps Vietnamese ones strict', () => {
    expect(gradeText('naïve', 'naive').isCorrect).toBe(true);
    expect(gradeText('jalapeño', 'jalapeno').isCorrect).toBe(true);
    expect(gradeText('straße', 'strasse').isCorrect).toBe(true);
    expect(gradeText('cá', 'ca').isCorrect).toBe(false);
  });

  it('never accepts a blank answer', () => {
    expect(gradeText('   ', '').isCorrect).toBe(false);
  });
});

describe('gradeSpokenText', () => {
  it('chấp nhận từ đọc khớp chính xác', () => {
    expect(gradeSpokenText('apple', 'apple')).toEqual({ isCorrect: true, expected: 'apple' });
  });

  it('bỏ dấu chấm câu tự động do Web Speech API gán (dấu chấm cuối câu)', () => {
    expect(gradeSpokenText('apple', 'Apple.').isCorrect).toBe(true);
    expect(gradeSpokenText('good morning', 'Good morning!').isCorrect).toBe(true);
  });

  it('chấp nhận khi người nói đọc kèm mạo từ (an apple, the dog)', () => {
    expect(gradeSpokenText('apple', 'an apple').isCorrect).toBe(true);
    expect(gradeSpokenText('cat', 'the cat').isCorrect).toBe(true);
  });

  it('chấp nhận phương án trong ngoặc đơn hoặc lược bỏ ngoặc đơn', () => {
    expect(gradeSpokenText('autumn (fall)', 'autumn').isCorrect).toBe(true);
    expect(gradeSpokenText('autumn (fall)', 'fall').isCorrect).toBe(true);
    expect(gradeSpokenText('(to) swim', 'swim').isCorrect).toBe(true);
    expect(gradeSpokenText('(to) swim', 'to swim').isCorrect).toBe(true);
  });

  it('chấp nhận các từ có gạch nối hoặc gạch chéo', () => {
    expect(gradeSpokenText('ice-cream', 'ice cream').isCorrect).toBe(true);
    expect(gradeSpokenText('cinema / movie theater', 'cinema').isCorrect).toBe(true);
    expect(gradeSpokenText('cinema / movie theater', 'movie theater').isCorrect).toBe(true);
  });

  it('dung sai âm học và chính tả Anh-Anh / Anh-Mỹ (theatre/theater, colour/color)', () => {
    expect(gradeSpokenText('theatre', 'theater').isCorrect).toBe(true);
    expect(gradeSpokenText('colour', 'color').isCorrect).toBe(true);
    expect(gradeSpokenText('pronunciation', 'pronounciation').isCorrect).toBe(true);
  });

  it('đổi số máy nhận dạng trả về thành chữ', () => {
    expect(gradeSpokenText('four', '4').isCorrect).toBe(true);
    expect(gradeSpokenText('twenty one', '21').isCorrect).toBe(true);
    expect(gradeSpokenText('12', 'twelve').isCorrect).toBe(true);
  });

  it('chấp nhận từ đồng âm mà máy không phân biệt được', () => {
    expect(gradeSpokenText('two', 'too').isCorrect).toBe(true);
    expect(gradeSpokenText('write', 'right').isCorrect).toBe(true);
    expect(gradeSpokenText('flower', 'flour').isCorrect).toBe(true);
  });

  it('từ 3 chữ cái cho lệch một chữ nếu giữ chữ đầu', () => {
    expect(gradeSpokenText('cat', 'cap').isCorrect).toBe(true);
    expect(gradeSpokenText('cat', 'bat').isCorrect).toBe(false);
    expect(gradeSpokenText('dog', 'cat').isCorrect).toBe(false);
  });

  it('từ chối từ hoàn toàn khác hoặc chuỗi rỗng', () => {
    expect(gradeSpokenText('apple', 'orange').isCorrect).toBe(false);
    expect(gradeSpokenText('apple', '').isCorrect).toBe(false);
  });
});
