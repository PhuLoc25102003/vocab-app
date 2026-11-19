import type {
  Question,
  StudyLanguages,
  StudyProgress,
  SessionResult,
  StartedSession,
  StudySession,
  UserAnswer,
} from '@vocab/shared';
import { create } from 'zustand';
import { clearSnapshot, saveProgress, saveStarted } from './session-snapshot';

const NOT_RECORDED = -1;

interface BeginOptions {
  /** Có khoá thì phiên được giữ lại để khôi phục khi tải lại trang. */
  snapshotKey?: string;
  progress?: StudyProgress;
}

interface StudyState {
  session: StudySession | null;
  questions: Question[];
  languages: StudyLanguages;
  position: number;
  /** Vị trí câu đã ghi nhận đáp án nhưng người học chưa sang câu sau. */
  recorded: number;
  /** Đáp án chưa được lưu. Chỉ xoá sau khi server đã nhận. */
  pending: UserAnswer[];
  result: SessionResult | null;
  snapshotKey: string | null;
  begin: (started: StartedSession, options?: BeginOptions) => void;
  record: (answer: UserAnswer) => void;
  answer: (answer: UserAnswer) => void;
  acknowledge: (sessionId: string, count: number) => void;
  finish: (result: SessionResult) => void;
}

export const useStudyStore = create<StudyState>((set) => ({
  session: null,
  questions: [],
  languages: { term: 'en', definition: 'vi' },
  position: 0,
  recorded: NOT_RECORDED,
  pending: [],
  result: null,
  snapshotKey: null,
  begin: ({ session, questions, languages }, { snapshotKey, progress } = {}) => {
    const position = progress?.position ?? 0;
    set({
      session,
      questions,
      languages,
      // Câu đã chấm trước khi tải lại không phải trả lời lần nữa.
      position: progress?.recorded === position ? position + 1 : position,
      recorded: NOT_RECORDED,
      pending: progress?.pending ?? [],
      result: null,
      snapshotKey: snapshotKey ?? null,
    });
  },
  record: (answer) =>
    set(({ position, recorded, pending }) =>
      recorded === position ? {} : { recorded: position, pending: [...pending, answer] },
    ),
  answer: (answer) =>
    set(({ position, recorded, pending }) => ({
      position: position + 1,
      pending: recorded === position ? pending : [...pending, answer],
    })),
  acknowledge: (sessionId, count) =>
    set(({ session, pending }) =>
      session?.id === sessionId ? { pending: pending.slice(count) } : {},
    ),
  finish: (result) => set({ result }),
}));

useStudyStore.subscribe((state, previous) => {
  const { snapshotKey, session, questions, languages, position, recorded, pending } = state;
  if (!snapshotKey || !session) {
    return;
  }
  if (state.result) {
    if (!previous.result) {
      clearSnapshot(snapshotKey);
    }
    return;
  }
  if (session !== previous.session) {
    saveStarted(snapshotKey, { session, questions, languages });
  }
  saveProgress(snapshotKey, { position, recorded, pending });
});
