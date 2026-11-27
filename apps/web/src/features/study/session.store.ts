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

export function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }
  return result;
}

export function getSavedShuffle(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem('vocab.study.shuffle') !== 'false';
  } catch {
    return true;
  }
}

interface StudyState {
  session: StudySession | null;
  questions: Question[];
  originalQuestions: Question[];
  languages: StudyLanguages;
  position: number;
  /** Vị trí câu đã ghi nhận đáp án nhưng người học chưa sang câu sau. */
  recorded: number;
  /** Đáp án chưa được lưu. Chỉ xoá sau khi server đã nhận. */
  pending: UserAnswer[];
  result: SessionResult | null;
  snapshotKey: string | null;
  shuffle: boolean;
  toggleShuffle: () => void;
  begin: (started: StartedSession, options?: BeginOptions) => void;
  record: (answer: UserAnswer) => void;
  answer: (answer: UserAnswer) => void;
  /** Đi tiếp mà không ghi đáp án, cho câu người học chưa gặp (ví dụ trò chơi kết thúc sớm). */
  skip: () => void;
  acknowledge: (sessionId: string, count: number) => void;
  finish: (result: SessionResult) => void;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  session: null,
  questions: [],
  originalQuestions: [],
  languages: { term: 'en', definition: 'vi' },
  position: 0,
  recorded: NOT_RECORDED,
  pending: [],
  result: null,
  snapshotKey: null,
  shuffle: getSavedShuffle(),
  toggleShuffle: () => {
    const state = get();
    const newShuffle = !state.shuffle;
    try {
      window.localStorage.setItem('vocab.study.shuffle', String(newShuffle));
    } catch {
      // ignore
    }
    const { questions, originalQuestions, position } = state;
    if (position >= questions.length) {
      set({ shuffle: newShuffle });
      return;
    }
    const answered = questions.slice(0, position);
    const remaining = questions.slice(position);
    let newRemaining: Question[];
    if (newShuffle) {
      newRemaining = shuffleArray([...remaining]);
    } else {
      const origIndex = new Map(originalQuestions.map((q, idx) => [q.id, idx]));
      newRemaining = [...remaining].sort(
        (a, b) => (origIndex.get(a.id) ?? 0) - (origIndex.get(b.id) ?? 0),
      );
    }
    set({
      shuffle: newShuffle,
      questions: [...answered, ...newRemaining],
    });
  },
  begin: ({ session, questions, languages }, { snapshotKey, progress } = {}) => {
    const position = progress?.position ?? 0;
    const shuffle = get().shuffle;
    const originalQuestions = [...questions];
    // Nếu tiếp tục phiên dở (progress) thì giữ nguyên thứ tự câu đã lưu; nếu phiên mới thì trộn theo shuffle
    const activeQuestions = progress || !shuffle ? [...questions] : shuffleArray([...questions]);

    set({
      session,
      questions: activeQuestions,
      originalQuestions,
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
  skip: () => set(({ position }) => ({ position: position + 1 })),
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
