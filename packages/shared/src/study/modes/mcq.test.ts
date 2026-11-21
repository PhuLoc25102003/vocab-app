import { describe, expect, it } from 'vitest';
import { getMode } from '../registry';
import { MCQ_CHOICE_COUNT, McqMode } from './mcq';

const card = (id: string, definition: string) => ({ id, term: `term ${id}`, definition });
const cards = ['một', 'hai', 'ba', 'bốn', 'năm', 'sáu'].map((text, i) => card(`c${i}`, text));
const mode = new McqMode();
const random = () => 0.42;

describe('McqMode', () => {
  it('is registered', () => {
    expect(getMode('MCQ')).toBeInstanceOf(McqMode);
  });

  it('builds four distinct choices including the answer', () => {
    for (const question of mode.buildQuestions(cards, { random })) {
      expect(question.choices).toHaveLength(MCQ_CHOICE_COUNT);
      expect(new Set(question.choices).size).toBe(MCQ_CHOICE_COUNT);
      expect(question.choices).toContain(question.expected);
    }
  });

  it('is deterministic for the same random source', () => {
    const sequence = () => {
      let value = 0;
      return () => {
        value = (value + 0.37) % 1;
        return value;
      };
    };

    expect(mode.buildQuestions(cards, { random: sequence() })).toEqual(
      mode.buildQuestions(cards, { random: sequence() }),
    );
  });

  it('uses every card for distractors when limited', () => {
    const questions = mode.buildQuestions(cards, { limit: 1, random });

    expect(questions).toHaveLength(1);
    expect(questions[0]?.choices).toHaveLength(MCQ_CHOICE_COUNT);
  });

  it('skips definitions equal to the answer', () => {
    const [question] = mode.buildQuestions(
      [card('a', 'Táo'), card('b', ' táo '), card('c', 'lê')],
      { random },
    );

    expect(question?.choices).toHaveLength(2);
    expect(question?.choices).toContain('lê');
  });

  it('still works with a single card', () => {
    const [question] = mode.buildQuestions([card('a', 'táo')], { random });

    expect(question?.choices).toEqual(['táo']);
  });

  it('grades the chosen text', () => {
    const [question] = mode.buildQuestions(cards, { random });
    const reply = (value: string) => ({ questionId: 'c0', value, timeMs: 1 });

    expect(mode.grade(question!, reply('một')).isCorrect).toBe(true);
    expect(mode.grade(question!, reply('hai')).isCorrect).toBe(false);
  });
});
