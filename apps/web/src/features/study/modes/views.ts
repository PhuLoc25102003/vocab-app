import type { Question, StudyLanguages, StudyMode, UserAnswer } from '@vocab/shared';
import type { ComponentType } from 'react';
import { FlashcardMode } from './flashcard/flashcard-mode';

export interface StudyModeProps {
  question: Question;
  languages: StudyLanguages;
  /** Gọi đúng một lần cho mỗi câu, khi người học chuyển sang câu tiếp theo. */
  onAnswer: (answer: UserAnswer) => void;
}

/** Thêm chế độ mới chỉ cần khai báo view ở đây. */
export const STUDY_VIEWS: Partial<Record<StudyMode, ComponentType<StudyModeProps>>> = {
  FLASHCARD: FlashcardMode,
};
