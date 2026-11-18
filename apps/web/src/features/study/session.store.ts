import type {
  Question,
  SessionResult,
  StartedSession,
  StudySession,
  UserAnswer,
} from '@vocab/shared';
import { create } from 'zustand';

interface StudyState {
  session: StudySession | null;
  questions: Question[];
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
  position: 0,
  pending: [],
  result: null,
  begin: ({ session, questions }) =>
    set({ session, questions, position: 0, pending: [], result: null }),
  answer: (answer) =>
    set(({ position, pending }) => ({ position: position + 1, pending: [...pending, answer] })),
  acknowledge: (sessionId, count) =>
    set(({ session, pending }) =>
      session?.id === sessionId ? { pending: pending.slice(count) } : {},
    ),
  finish: (result) => set({ result }),
}));
