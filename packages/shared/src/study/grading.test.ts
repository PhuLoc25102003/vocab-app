import { describe, expect, it } from 'vitest';
import { gradeText, normalizeAnswer } from './grading';

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

  it('never accepts a blank answer', () => {
    expect(gradeText('   ', '').isCorrect).toBe(false);
  });
});
