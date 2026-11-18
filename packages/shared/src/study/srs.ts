/** Trùng các trường lịch ôn của bảng `CardProgress`. `interval` tính bằng ngày. */
export interface SrsState {
  ease: number;
  interval: number;
  reps: number;
  lapses: number;
  dueAt: Date;
  lastResult: boolean | null;
}

export const SRS_CONFIG = {
  initialEase: 2.5,
  minEase: 1.3,
  maxEase: 3,
  easeBonus: 0.05,
  easePenalty: 0.2,
  firstIntervalDays: 1,
  secondIntervalDays: 6,
  maxIntervalDays: 365,
  retryMinutes: 10,
} as const;

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

const addMs = (date: Date, ms: number) => new Date(date.getTime() + ms);

function clampEase(ease: number): number {
  const rounded = Math.round(ease * 100) / 100;
  return Math.min(SRS_CONFIG.maxEase, Math.max(SRS_CONFIG.minEase, rounded));
}

function nextInterval({ reps, interval, ease }: SrsState): number {
  if (reps === 0) return SRS_CONFIG.firstIntervalDays;
  if (reps === 1) return SRS_CONFIG.secondIntervalDays;
  return Math.min(SRS_CONFIG.maxIntervalDays, Math.round(interval * ease));
}

export function createSrsState(now: Date): SrsState {
  return {
    ease: SRS_CONFIG.initialEase,
    interval: 0,
    reps: 0,
    lapses: 0,
    dueAt: now,
    lastResult: null,
  };
}

/**
 * Tính lịch ôn theo SM-2 rút gọn, chỉ dựa vào đúng hoặc sai.
 *
 * Trả lời đúng khi thẻ chưa đến hạn không giãn lịch, nếu không học dồn nhiều lượt
 * trong một ngày sẽ đẩy thẻ đi rất xa. Sai ở thẻ chưa từng nhớ không tính là quên,
 * nên không trừ `ease` và không tăng `lapses`.
 */
export function applyReview(state: SrsState, isCorrect: boolean, now: Date): SrsState {
  if (!isCorrect) {
    const forgotten = state.reps > 0;
    return {
      ease: forgotten ? clampEase(state.ease - SRS_CONFIG.easePenalty) : state.ease,
      interval: 0,
      reps: 0,
      lapses: forgotten ? state.lapses + 1 : state.lapses,
      dueAt: addMs(now, SRS_CONFIG.retryMinutes * MINUTE_MS),
      lastResult: false,
    };
  }

  if (state.dueAt.getTime() > now.getTime()) {
    return { ...state, lastResult: true };
  }

  const interval = nextInterval(state);
  return {
    ease: clampEase(state.ease + SRS_CONFIG.easeBonus),
    interval,
    reps: state.reps + 1,
    lapses: state.lapses,
    dueAt: addMs(now, interval * DAY_MS),
    lastResult: true,
  };
}
