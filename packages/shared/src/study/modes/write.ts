import { gradeText } from '../grading';
import { registerMode } from '../registry';
import type {
  GradeResult,
  Question,
  StudyCard,
  StudyModeStrategy,
  StudyOptions,
  UserAnswer,
} from '../types';

export class WriteMode implements StudyModeStrategy {
  readonly mode = 'WRITE' as const;

  buildQuestions(cards: StudyCard[], { limit }: StudyOptions): Question[] {
    return cards.slice(0, limit ?? cards.length).map(({ id, term, definition, imageUrl }) => ({
      id,
      cardId: id,
      mode: this.mode,
      prompt: definition,
      expected: term,
      ...(imageUrl ? { imageUrl } : {}),
    }));
  }

  grade(question: Question, answer: UserAnswer): GradeResult {
    return gradeText(question.expected, answer.value);
  }
}

registerMode(new WriteMode());
