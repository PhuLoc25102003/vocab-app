import { describe, expect, it } from 'vitest';
import { getMode, registerMode } from './registry';
import { studyModeSchema, type StudyMode, type StudyModeStrategy } from './types';

const createStrategy = (mode: StudyMode): StudyModeStrategy => ({
  mode,
  buildQuestions: () => [],
  grade: (question) => ({ isCorrect: true, expected: question.expected }),
});

describe('study mode registry', () => {
  it('returns the registered strategy', () => {
    const strategy = createStrategy('MATCH');
    registerMode(strategy);

    expect(getMode('MATCH')).toBe(strategy);
  });

  it('replaces a strategy registered for the same mode', () => {
    const replacement = createStrategy('CLOZE');
    registerMode(createStrategy('CLOZE'));
    registerMode(replacement);

    expect(getMode('CLOZE')).toBe(replacement);
  });

  it('throws for a mode without a strategy', () => {
    expect(() => getMode('TEST')).toThrow('Unknown study mode: TEST');
  });
});

describe('studyModeSchema', () => {
  it('accepts known modes and rejects others', () => {
    expect(studyModeSchema.parse('FLASHCARD')).toBe('FLASHCARD');
    expect(studyModeSchema.safeParse('flashcard').success).toBe(false);
  });
});
