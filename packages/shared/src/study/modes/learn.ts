import { gradeText } from '../grading';
import { registerMode } from '../registry';
import type {
  GradeResult,
  LearnLevel,
  Question,
  StudyCard,
  StudyModeStrategy,
  StudyOptions,
  UserAnswer,
} from '../types';
import { McqMode } from './mcq';

/** Số câu mỗi vòng Learn. Câu sai trong vòng được hỏi lại trước khi sang vòng sau. */
export const LEARN_ROUND_SIZE = 7;

const CHOICE_SUFFIX = ':choice';
const WRITE_SUFFIX = ':write';

/** Mức nhớ từ tiến độ đã lưu: đã trả lời và lần gần nhất đúng thì coi là đã biết. */
export function learnLevel(
  progress: { reps: number; lastResult: boolean | null } | null,
): LearnLevel {
  return progress && progress.reps > 0 && progress.lastResult === true ? 'known' : 'new';
}

/**
 * Trộn dạng câu theo mức nhớ. Thẻ chưa thuộc hỏi trắc nghiệm để nhận ra nghĩa trước, rồi hỏi gõ
 * từ ở phần sau phiên. Thẻ đã thuộc chỉ hỏi gõ từ. Thẻ không có mức nhớ được coi như chưa thuộc,
 * nên khi API dựng lại câu để chấm thì luôn có đủ cả hai dạng.
 */
export class LearnMode implements StudyModeStrategy {
  readonly mode = 'LEARN' as const;
  private readonly choices = new McqMode();

  buildQuestions(cards: StudyCard[], options: StudyOptions): Question[] {
    const selected = cards.slice(0, options.limit ?? cards.length);
    const isNew = (level: LearnLevel | undefined) => level !== 'known';
    const fresh = selected.filter(({ level }) => isNew(level));
    // Đáp án nhiễu lấy từ toàn bộ thẻ để bộ ít thẻ chưa thuộc vẫn đủ lựa chọn.
    const choiceById = new Map(
      this.choices.buildQuestions(cards, { random: options.random }).map((q) => [q.id, q]),
    );

    const recognition = fresh.map(({ id }): Question => {
      const { prompt, expected, choices } = choiceById.get(id)!;
      return {
        id: `${id}${CHOICE_SUFFIX}`,
        cardId: id,
        mode: this.mode,
        prompt,
        expected,
        choices,
      };
    });
    const recall = selected.map(({ id, term, definition }): Question => ({
      id: `${id}${WRITE_SUFFIX}`,
      cardId: id,
      mode: this.mode,
      prompt: definition,
      expected: term,
    }));
    return [...recognition, ...recall];
  }

  grade(question: Question, answer: UserAnswer): GradeResult {
    return gradeText(question.expected, answer.value);
  }
}

registerMode(new LearnMode());
