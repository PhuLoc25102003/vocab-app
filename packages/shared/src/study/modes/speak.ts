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

/**
 * Luyện nói: hiện từ và nghĩa, người học đọc to từ đó. Web gửi câu nhận dạng được,
 * bỏ qua thì gửi chuỗi rỗng và tính là sai.
 */
export class SpeakMode implements StudyModeStrategy {
  readonly mode = 'SPEAK' as const;

  buildQuestions(cards: StudyCard[], { limit }: StudyOptions): Question[] {
    return cards.slice(0, limit ?? cards.length).map(({ id, term, definition }) => ({
      id,
      cardId: id,
      mode: this.mode,
      prompt: term,
      expected: term,
      hint: definition,
    }));
  }

  grade(question: Question, answer: UserAnswer): GradeResult {
    return gradeText(question.expected, answer.value);
  }
}

registerMode(new SpeakMode());
