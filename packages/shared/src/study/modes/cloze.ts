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

export const CLOZE_BLANK = '_____';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Thay từ trong câu ví dụ bằng chỗ trống. Chỉ khớp nguyên từ, không phân biệt hoa thường,
 * nên "cat" không khớp "category". Trả `null` khi câu không chứa từ.
 */
export function makeCloze(example: string, term: string): string | null {
  const word = term.trim();
  if (!word) {
    return null;
  }
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(word)}(?![\\p{L}\\p{N}])`, 'giu');
  const blanked = example.replace(pattern, CLOZE_BLANK);
  return blanked === example ? null : blanked.trim();
}

/** Câu hỏi là câu ví dụ có chỗ trống, `hint` là nghĩa. Thẻ không có ví dụ chứa từ bị bỏ qua. */
export class ClozeMode implements StudyModeStrategy {
  readonly mode = 'CLOZE' as const;

  buildQuestions(cards: StudyCard[], { limit }: StudyOptions): Question[] {
    const questions = cards.flatMap(({ id, term, definition, example, imageUrl }) => {
      const prompt = example ? makeCloze(example, term) : null;
      return prompt
        ? [
            {
              id,
              cardId: id,
              mode: this.mode,
              prompt,
              expected: term,
              hint: definition,
              ...(imageUrl ? { imageUrl } : {}),
            },
          ]
        : [];
    });
    return questions.slice(0, limit ?? questions.length);
  }

  grade(question: Question, answer: UserAnswer): GradeResult {
    return gradeText(question.expected, answer.value);
  }
}

registerMode(new ClozeMode());
