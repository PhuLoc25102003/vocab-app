import { describe, expect, it } from 'vitest';
import { getMode, isModeAvailable } from '../registry';
import { FLASHCARD_ANSWERS, FlashcardMode } from './flashcard';

const cards = [
  { id: 'c1', term: 'apple', definition: 'quả táo' },
  { id: 'c2', term: 'pear', definition: 'quả lê' },
];
const mode = new FlashcardMode();
const [question] = mode.buildQuestions(cards, {});

describe('FlashcardMode', () => {
  it('is registered', () => {
    expect(isModeAvailable('FLASHCARD')).toBe(true);
    expect(getMode('FLASHCARD')).toBeInstanceOf(FlashcardMode);
  });

  it('builds one question per card in order', () => {
    expect(mode.buildQuestions(cards, {})).toEqual([
      { id: 'c1', cardId: 'c1', mode: 'FLASHCARD', prompt: 'apple', expected: 'quả táo' },
      { id: 'c2', cardId: 'c2', mode: 'FLASHCARD', prompt: 'pear', expected: 'quả lê' },
    ]);
  });

  it('respects the limit and an empty list', () => {
    expect(mode.buildQuestions(cards, { limit: 1 })).toHaveLength(1);
    expect(mode.buildQuestions([], {})).toEqual([]);
  });

  it.each([
    [FLASHCARD_ANSWERS.known, true],
    [FLASHCARD_ANSWERS.unknown, false],
    ['quả táo', false],
  ])('grades %s', (value, isCorrect) => {
    expect(mode.grade(question!, { questionId: 'c1', value, timeMs: 10 })).toEqual({
      isCorrect,
      expected: 'quả táo',
    });
  });
});
