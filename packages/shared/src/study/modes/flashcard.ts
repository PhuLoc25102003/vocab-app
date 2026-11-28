import { registerMode } from '../registry';
import type {
  GradeResult,
  Question,
  StudyCard,
  StudyModeStrategy,
  StudyOptions,
  UserAnswer,
} from '../types';

/** Người học tự đánh giá sau khi lật thẻ, nên đáp án chỉ có hai giá trị. */
export const FLASHCARD_ANSWERS = { known: 'known', unknown: 'unknown' } as const;

export class FlashcardMode implements StudyModeStrategy {
  readonly mode = 'FLASHCARD' as const;
  readonly selfGraded = true;

  buildQuestions(cards: StudyCard[], { limit }: StudyOptions): Question[] {
    return cards.slice(0, limit ?? cards.length).map(({ id, term, definition, imageUrl }) => ({
      id,
      cardId: id,
      mode: this.mode,
      prompt: term,
      expected: definition,
      ...(imageUrl ? { imageUrl } : {}),
    }));
  }

  grade(question: Question, answer: UserAnswer): GradeResult {
    return { isCorrect: answer.value === FLASHCARD_ANSWERS.known, expected: question.expected };
  }
}

registerMode(new FlashcardMode());
