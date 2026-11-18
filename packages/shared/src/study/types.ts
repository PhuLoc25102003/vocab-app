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
]);
export type StudyMode = z.infer<typeof studyModeSchema>;

export interface StudyCard {
  id: string;
  term: string;
  definition: string;
}

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
