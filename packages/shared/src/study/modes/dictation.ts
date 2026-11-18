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

/** `prompt` là nội dung được đọc lên, giao diện không hiện chữ này trước khi chấm. */
export class DictationMode implements StudyModeStrategy {
  readonly mode = 'DICTATION' as const;

  buildQuestions(cards: StudyCard[], { limit }: StudyOptions): Question[] {
    return cards.slice(0, limit ?? cards.length).map(({ id, term }) => ({
      id,
      cardId: id,
      mode: this.mode,
      prompt: term,
      expected: term,
    }));
  }

  grade(question: Question, answer: UserAnswer): GradeResult {
    return gradeText(question.expected, answer.value);
  }
}

registerMode(new DictationMode());
