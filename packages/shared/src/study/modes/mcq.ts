import { gradeText, normalizeAnswer } from '../grading';
import { registerMode } from '../registry';
import type {
  GradeResult,
  Question,
  StudyCard,
  StudyModeStrategy,
  StudyOptions,
  UserAnswer,
} from '../types';

export const MCQ_CHOICE_COUNT = 4;

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other]!, result[index]!];
  }
  return result;
}

export class McqMode implements StudyModeStrategy {
  readonly mode = 'MCQ' as const;

  buildQuestions(cards: StudyCard[], { limit, random = Math.random }: StudyOptions): Question[] {
    return cards.slice(0, limit ?? cards.length).map(({ id, term, definition }) => {
      // Lấy từ toàn bộ thẻ để bộ từ bị giới hạn số câu vẫn đủ đáp án nhiễu.
      const seen = new Set([normalizeAnswer(definition)]);
      const distractors: string[] = [];
      for (const card of shuffle(cards, random)) {
        const key = normalizeAnswer(card.definition);
        if (!seen.has(key) && distractors.length < MCQ_CHOICE_COUNT - 1) {
          seen.add(key);
          distractors.push(card.definition);
        }
      }

      return {
        id,
        cardId: id,
        mode: this.mode,
        prompt: term,
        expected: definition,
        choices: shuffle([definition, ...distractors], random),
      };
    });
  }

  grade(question: Question, answer: UserAnswer): GradeResult {
    return gradeText(question.expected, answer.value);
  }
}

registerMode(new McqMode());
