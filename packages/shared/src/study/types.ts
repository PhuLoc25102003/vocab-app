import { z } from 'zod';

/** Phải khớp enum `StudyMode` trong `apps/api/prisma/schema.prisma`. */
export const studyModeSchema = z.enum([
  'FLASHCARD',
  'LEARN',
  'WRITE',
  'DICTATION',
  'CLOZE',
  'MCQ',
  'MATCH',
  'TEST',
  'SPEAK',
  'WORD_RAIN',
]);
export type StudyMode = z.infer<typeof studyModeSchema>;

/** Tên chế độ hiện cho người dùng, ví dụ khi giáo viên giao bài. */
export const STUDY_MODE_LABELS: Record<StudyMode, string> = {
  FLASHCARD: 'Flashcard',
  LEARN: 'Học kỹ',
  WRITE: 'Luyện viết',
  DICTATION: 'Nghe viết',
  CLOZE: 'Điền từ',
  MCQ: 'Trắc nghiệm',
  MATCH: 'Ghép cặp',
  TEST: 'Kiểm tra',
  SPEAK: 'Luyện nói',
  WORD_RAIN: 'Mưa từ',
};

export interface StudyCard {
  id: string;
  term: string;
  definition: string;
  /** Câu ví dụ, chế độ Điền từ cần có. */
  example?: string | null;
  /** Ảnh minh hoạ, chỉ chế độ không lộ đáp án mới đưa vào câu hỏi. */
  imageUrl?: string | null;
  /**
   * Mức nhớ của người học, chế độ Learn dùng để chọn dạng câu. Không có nghĩa là chưa biết,
   * như với khách hoặc khi API dựng lại câu hỏi để chấm.
   */
  level?: LearnLevel;
}

/** `new`: chưa học hoặc lần gần nhất sai. `known`: lần gần nhất trả lời đúng. */
export type LearnLevel = 'new' | 'known';

export interface StudyOptions {
  limit?: number;
  /** Nguồn ngẫu nhiên trong khoảng [0, 1), truyền vào để strategy vẫn là hàm thuần. */
  random?: () => number;
}

export interface Question {
  id: string;
  cardId: string;
  mode: StudyMode;
  prompt: string;
  expected: string;
  choices?: string[];
  /** Gợi ý hiện kèm câu hỏi, ví dụ nghĩa của từ trong chế độ Điền từ. */
  hint?: string;
  /** Ảnh minh hoạ nghĩa của thẻ, hiện cùng nghĩa. */
  imageUrl?: string;
}

export interface UserAnswer {
  questionId: string;
  value: string;
  timeMs: number;
}

export interface GradeResult {
  isCorrect: boolean;
  expected: string;
}

export interface StudyModeStrategy {
  readonly mode: StudyMode;
  buildQuestions(cards: StudyCard[], options: StudyOptions): Question[];
  grade(question: Question, answer: UserAnswer): GradeResult;
}
