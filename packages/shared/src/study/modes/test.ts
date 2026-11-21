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
import { McqMode } from './mcq';

/** Số câu mỗi phần của bài kiểm tra, người học nộp một lần cho mỗi phần. */
export const TEST_ROUND_SIZE = 20;

/** Dạng câu cố định theo id thẻ, để API dựng lại đề khi chấm vẫn ra đúng câu đó. */
export function testQuestionKind(cardId: string): 'choice' | 'write' {
  let hash = 0;
  for (const char of cardId) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1_000_003;
  }
  return hash % 2 === 0 ? 'choice' : 'write';
}

/** Đề trộn trắc nghiệm và gõ từ, mỗi thẻ một câu, chỉ chấm khi người học nộp bài. */
export class TestMode implements StudyModeStrategy {
  readonly mode = 'TEST' as const;
  private readonly choices = new McqMode();

  buildQuestions(cards: StudyCard[], { limit, random }: StudyOptions): Question[] {
    // Đáp án nhiễu lấy từ toàn bộ thẻ để đề ngắn vẫn đủ lựa chọn.
    const choiceById = new Map(
      this.choices.buildQuestions(cards, { random }).map((question) => [question.id, question]),
    );
    return cards.slice(0, limit ?? cards.length).map(({ id, term, definition }): Question => {
      if (testQuestionKind(id) === 'choice') {
        const { prompt, expected, choices } = choiceById.get(id)!;
        return { id: `${id}:choice`, cardId: id, mode: this.mode, prompt, expected, choices };
      }
      return { id: `${id}:write`, cardId: id, mode: this.mode, prompt: definition, expected: term };
    });
  }

  grade(question: Question, answer: UserAnswer): GradeResult {
    return gradeText(question.expected, answer.value);
  }
}

registerMode(new TestMode());
