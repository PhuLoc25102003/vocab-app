import { describe, expect, it } from 'vitest';
import { getMode } from '../registry';
import { DictationMode } from './dictation';

const cards = [
  { id: 'c1', term: 'Apple', definition: 'quả táo' },
  { id: 'c2', term: 'pear', definition: 'quả lê' },
];
const mode = new DictationMode();
const [question] = mode.buildQuestions(cards, {});
const reply = (value: string) => ({ questionId: 'c1', value, timeMs: 10 });

describe('DictationMode', () => {
  it('is registered', () => {
    expect(getMode('DICTATION')).toBeInstanceOf(DictationMode);
  });

  it('reads the term and expects the same term', () => {
    expect(question).toEqual({
      id: 'c1',
      cardId: 'c1',
      mode: 'DICTATION',
      prompt: 'Apple',
      expected: 'Apple',
    });
  });

  it('respects the limit and an empty list', () => {
    expect(mode.buildQuestions(cards, { limit: 1 })).toHaveLength(1);
    expect(mode.buildQuestions([], {})).toEqual([]);
  });

  it('grades spelling without case sensitivity', () => {
    expect(mode.grade(question!, reply(' apple ')).isCorrect).toBe(true);
    expect(mode.grade(question!, reply('aple')).isCorrect).toBe(false);
    expect(mode.grade(question!, reply('')).isCorrect).toBe(false);
  });
});
