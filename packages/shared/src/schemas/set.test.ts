import { describe, expect, it } from 'vitest';
import {
  CARD_DEFINITION_MAX_LENGTH,
  CARD_TERM_MAX_LENGTH,
  createSetSchema,
  MAX_CARDS_PER_SET,
  updateSetSchema,
} from './set';

const card = { term: 'apple', definition: 'quả táo' };

describe('createSetSchema', () => {
  it('áp giá trị mặc định', () => {
    expect(createSetSchema.parse({ title: '  Trái cây ' })).toEqual({
      title: 'Trái cây',
      termLang: 'en',
      defLang: 'vi',
      visibility: 'PRIVATE',
      cards: [],
    });
  });

  it('bỏ ownerId và các trường không khai báo', () => {
    expect(createSetSchema.parse({ title: 'A', ownerId: 'u2' })).not.toHaveProperty('ownerId');
  });

  it('cho phép xuống dòng trong định nghĩa', () => {
    const result = createSetSchema.parse({
      title: 'A',
      cards: [{ ...card, definition: 'dòng 1\ndòng 2' }],
    });
    expect(result.cards[0]?.definition).toBe('dòng 1\ndòng 2');
  });

  it.each([
    ['tên rỗng', { title: '  ' }],
    ['tên có ký tự điều khiển', { title: 'A\u0000' }],
    ['mã ngôn ngữ sai', { title: 'A', termLang: 'tiếng anh' }],
    [
      'thuật ngữ quá dài',
      { title: 'A', cards: [{ ...card, term: 'a'.repeat(CARD_TERM_MAX_LENGTH + 1) }] },
    ],
    [
      'định nghĩa quá dài',
      { title: 'A', cards: [{ ...card, definition: 'a'.repeat(CARD_DEFINITION_MAX_LENGTH + 1) }] },
    ],
    ['định nghĩa rỗng', { title: 'A', cards: [{ ...card, definition: ' ' }] }],
    ['định nghĩa có NUL', { title: 'A', cards: [{ ...card, definition: 'a\u0000' }] }],
    [
      'quá nhiều thẻ',
      { title: 'A', cards: Array.from({ length: MAX_CARDS_PER_SET + 1 }, () => card) },
    ],
  ])('từ chối %s', (_name, input) => {
    expect(createSetSchema.safeParse(input).success).toBe(false);
  });
});

describe('updateSetSchema', () => {
  it('cần ít nhất một thay đổi', () => {
    expect(updateSetSchema.safeParse({}).success).toBe(false);
  });

  it('cho phép xoá mô tả bằng null', () => {
    expect(updateSetSchema.parse({ description: null })).toEqual({ description: null });
  });
});
