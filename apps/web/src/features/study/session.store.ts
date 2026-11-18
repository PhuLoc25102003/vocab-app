import type {
  Question,
  StudyLanguages,
  SessionResult,
  StartedSession,
  StudySession,
  UserAnswer,
} from '@vocab/shared';
import { create } from 'zustand';

interface StudyState {
  session: StudySession | null;
  questions: Question[];
  languages: StudyLanguages;
  position: number;
  /** Đáp án chưa được lưu. Chỉ xoá sau khi server đã nhận. */
  pending: UserAnswer[];
  result: SessionResult | null;
  begin: (started: StartedSession) => void;
  answer: (answer: UserAnswer) => void;
  acknowledge: (sessionId: string, count: number) => void;
  finish: (result: SessionResult) => void;
}

export const useStudyStore = create<StudyState>((set) => ({
  session: null,
  questions: [],
  languages: { term: 'en', definition: 'vi' },
  position: 0,
  pending: [],
  result: null,
  begin: ({ session, questions, languages }) =>
    set({ session, questions, languages, position: 0, pending: [], result: null }),
  answer: (answer) =>
    set(({ position, pending }) => ({ position: position + 1, pending: [...pending, answer] })),
  acknowledge: (sessionId, count) =>
    set(({ session, pending }) =>
      session?.id === sessionId ? { pending: pending.slice(count) } : {},
    ),
  finish: (result) => set({ result }),
}));
