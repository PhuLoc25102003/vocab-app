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

/** Số cặp trong một vòng ghép, đủ nhìn hết trên màn hình 360 px. */
export const MATCH_ROUND_SIZE = 6;

/**
 * Mỗi câu là một từ, đáp án là nghĩa người học ghép vào lần đầu.
 * Giao diện xáo trộn nghĩa trong vòng, nên strategy không cần nguồn ngẫu nhiên.
 */
export class MatchMode implements StudyModeStrategy {
  readonly mode = 'MATCH' as const;

  buildQuestions(cards: StudyCard[], { limit }: StudyOptions): Question[] {
    return cards.slice(0, limit ?? cards.length).map(({ id, term, definition }) => ({
      id,
      cardId: id,
      mode: this.mode,
      prompt: term,
      expected: definition,
    }));
  }

  grade(question: Question, answer: UserAnswer): GradeResult {
    return gradeText(question.expected, answer.value);
  }
}

registerMode(new MatchMode());
