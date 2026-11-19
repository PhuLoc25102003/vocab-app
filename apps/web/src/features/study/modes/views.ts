import {
  LEARN_ROUND_SIZE,
  MATCH_ROUND_SIZE,
  TEST_ROUND_SIZE,
  type Question,
  type StudyLanguages,
  type StudyMode,
  type UserAnswer,
} from '@vocab/shared';
import type { ComponentType } from 'react';
import { ClozeModeView } from './cloze/cloze-mode';
import { DictationModeView } from './dictation/dictation-mode';
import { FlashcardMode } from './flashcard/flashcard-mode';
import { LearnModeView } from './learn/learn-mode';
import { MatchModeView } from './match/match-mode';
import { McqModeView } from './mcq/mcq-mode';
import { SpeakModeView } from './speak/speak-mode';
import { TestModeView } from './test/test-mode';
import { WriteModeView } from './write/write-mode';

export interface StudyModeProps {
  question: Question;
  languages: StudyLanguages;
  /** Gọi đúng một lần cho mỗi câu, khi người học chuyển sang câu tiếp theo. */
  onAnswer: (answer: UserAnswer) => void;
  /** Gọi khi đáp án vừa được chấm, để không mất nếu người học rời trang trước khi đi tiếp. */
  onChecked?: (answer: UserAnswer) => void;
  /** Các câu từ câu hiện tại đến hết vòng, chỉ có ở chế độ khai báo trong `STUDY_ROUND_SIZE`. */
  round?: Question[];
}

/** Thêm chế độ mới chỉ cần khai báo view ở đây. */
export const STUDY_VIEWS: Partial<Record<StudyMode, ComponentType<StudyModeProps>>> = {
  FLASHCARD: FlashcardMode,
  LEARN: LearnModeView,
  WRITE: WriteModeView,
  DICTATION: DictationModeView,
  MCQ: McqModeView,
  CLOZE: ClozeModeView,
  MATCH: MatchModeView,
  TEST: TestModeView,
  SPEAK: SpeakModeView,
};

/** Chế độ cần nhiều câu cùng lúc. View gọi `onAnswer` lần lượt cho từng câu khi xong vòng. */
export const STUDY_ROUND_SIZE: Partial<Record<StudyMode, number>> = {
  MATCH: MATCH_ROUND_SIZE,
  LEARN: LEARN_ROUND_SIZE,
  TEST: TEST_ROUND_SIZE,
};
