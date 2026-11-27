import { z } from 'zod';
import { gradeSpokenText, gradeText } from '../grading';
import { registerMode } from '../registry';
import type {
  GradeResult,
  Question,
  StudyCard,
  StudyModeStrategy,
  StudyOptions,
  UserAnswer,
} from '../types';

/** Bộ cần ít nhất bấy nhiêu thẻ để chơi Mưa từ. */
export const WORD_RAIN_MIN_CARDS = 4;
/** Cả bộ rơi trong một ván, nên vòng lấy hết câu (giới hạn số thẻ của bộ nhỏ hơn số này). */
export const WORD_RAIN_ROUND_SIZE = 2000;
/** Đáp án từ nhận dạng giọng nói mang tiền tố này để chấm như chế độ Luyện nói. */
export const WORD_RAIN_SPOKEN_PREFIX = 'spoken:';

export const wordRainStyleSchema = z.enum(['TYPE', 'SPEAK']);
export type WordRainStyle = z.infer<typeof wordRainStyleSchema>;

/**
 * Mưa từ: nghĩa rơi xuống, người học gõ hoặc nói từ tương ứng để bắn. Mục tiêu chạm đáy thì web
 * gửi đáp án rỗng, tính là sai. Gõ chấm như Viết, nói chấm như Luyện nói.
 */
export class WordRainMode implements StudyModeStrategy {
  readonly mode = 'WORD_RAIN' as const;

  buildQuestions(cards: StudyCard[], { limit }: StudyOptions): Question[] {
    return cards.slice(0, limit ?? cards.length).map(({ id, term, definition }) => ({
      id,
      cardId: id,
      mode: this.mode,
      prompt: definition,
      expected: term,
    }));
  }

  grade(question: Question, answer: UserAnswer): GradeResult {
    if (answer.value.startsWith(WORD_RAIN_SPOKEN_PREFIX)) {
      return gradeSpokenText(question.expected, answer.value.slice(WORD_RAIN_SPOKEN_PREFIX.length));
    }
    return gradeText(question.expected, answer.value);
  }
}

registerMode(new WordRainMode());
