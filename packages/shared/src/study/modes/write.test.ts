import { describe, expect, it } from 'vitest';
import { getMode } from '../registry';
import { WriteMode } from './write';

const cards = [
  { id: 'c1', term: 'Give up', definition: 'từ bỏ' },
  { id: 'c2', term: 'tiếng Việt', definition: 'Vietnamese' },
];
const mode = new WriteMode();
const [giveUp, vietnamese] = mode.buildQuestions(cards, {});
const reply = (value: string) => ({ questionId: 'c1', value, timeMs: 10 });

describe('WriteMode', () => {
  it('is registered', () => {
    expect(getMode('WRITE')).toBeInstanceOf(WriteMode);
  });

  it('asks for the term from its definition', () => {
    expect(giveUp).toEqual({
      id: 'c1',
      cardId: 'c1',
      mode: 'WRITE',
      prompt: 'từ bỏ',
      expected: 'Give up',
    });
  });

  it('respects the limit and an empty list', () => {
    expect(mode.buildQuestions(cards, { limit: 1 })).toHaveLength(1);
    expect(mode.buildQuestions([], {})).toEqual([]);
  });

  it('ignores case and extra spaces', () => {
    expect(mode.grade(giveUp!, reply('  give   UP ')).isCorrect).toBe(true);
  });

  it('rejects wrong and blank answers', () => {
    expect(mode.grade(giveUp!, reply('give')).isCorrect).toBe(false);
    expect(mode.grade(giveUp!, reply('   ')).isCorrect).toBe(false);
  });

  it('requires Vietnamese tone marks', () => {
    expect(mode.grade(vietnamese!, reply('tieng viet')).isCorrect).toBe(false);
    expect(mode.grade(vietnamese!, reply('Tiếng Việt')).isCorrect).toBe(true);
  });
});
