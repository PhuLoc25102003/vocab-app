import type { Question, StudyLanguages, StudyMode, UserAnswer } from '@vocab/shared';
import type { ComponentType } from 'react';
import { ClozeModeView } from './cloze/cloze-mode';
import { DictationModeView } from './dictation/dictation-mode';
import { FlashcardMode } from './flashcard/flashcard-mode';
import { McqModeView } from './mcq/mcq-mode';
import { WriteModeView } from './write/write-mode';

export interface StudyModeProps {
  question: Question;
  languages: StudyLanguages;
  /** Gọi đúng một lần cho mỗi câu, khi người học chuyển sang câu tiếp theo. */
  onAnswer: (answer: UserAnswer) => void;
  /** Gọi khi đáp án vừa được chấm, để không mất nếu người học rời trang trước khi đi tiếp. */
  onChecked?: (answer: UserAnswer) => void;
}

/** Thêm chế độ mới chỉ cần khai báo view ở đây. */
export const STUDY_VIEWS: Partial<Record<StudyMode, ComponentType<StudyModeProps>>> = {
  FLASHCARD: FlashcardMode,
  WRITE: WriteModeView,
  DICTATION: DictationModeView,
  MCQ: McqModeView,
  CLOZE: ClozeModeView,
};
