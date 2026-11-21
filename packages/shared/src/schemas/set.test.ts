import { describe, expect, it } from 'vitest';
import {
  CARD_DEFINITION_MAX_LENGTH,
  CARD_TERM_MAX_LENGTH,
  createSetSchema,
  MAX_CARDS_PER_SET,
  setFormSchema,
  updateSetSchema,
} from './set';

describe('setFormSchema', () => {
  const values = {
    title: ' Trái cây ',
    description: '  ',
    termLang: 'en',
    defLang: 'vi',
    visibility: 'PRIVATE',
    cards: [],
  };
  const draft = { term: '', definition: '', phonetic: '', example: '' };

  it('cắt khoảng trắng và cho phép mô tả trống', () => {
    expect(setFormSchema.parse(values)).toEqual({ ...values, title: 'Trái cây', description: '' });
  });

  it('bắt buộc có tên', () => {
    expect(setFormSchema.safeParse({ ...values, title: ' ' }).success).toBe(false);
  });

  it('bỏ dòng mới để trống, giữ id và bỏ trường phụ trống', () => {
    const cards = [
      draft,
      { ...draft, id: 'c1', term: ' apple ', definition: 'quả táo', phonetic: ' ' },
    ];

    expect(setFormSchema.parse({ ...values, cards }).cards).toEqual([
      { id: 'c1', term: 'apple', definition: 'quả táo' },
    ]);
  });

  it('báo lỗi đúng ô của đúng dòng', () => {
    const cards = [
      { ...draft, term: 'apple', definition: 'quả táo' },
      { ...draft, term: 'pear' },
    ];
    const result = setFormSchema.safeParse({ ...values, cards });

    expect(result.error?.issues.map(({ path }) => path)).toEqual([['cards', 1, 'definition']]);
  });

  it('không cho để trống thẻ đã có', () => {
    const result = setFormSchema.safeParse({ ...values, cards: [{ ...draft, id: 'c1' }] });

    const fields = new Set(result.error?.issues.map(({ path }) => path.at(-1)));
    expect([...fields]).toEqual(['term', 'definition']);
  });
});

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
