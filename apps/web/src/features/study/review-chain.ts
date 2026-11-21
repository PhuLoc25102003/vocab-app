import type { StudyMode } from '@vocab/shared';
import type { Route } from 'next';
import { parseStudyMode } from './modes/parse-mode';

/** Chế độ ôn được ở trang Ôn hôm nay, theo thứ tự gợi ý. */
export const REVIEW_MODES: readonly StudyMode[] = [
  'FLASHCARD',
  'LEARN',
  'WRITE',
  'DICTATION',
  'MCQ',
  'CLOZE',
  'MATCH',
];

const MODES_KEY = 'vocab.review-modes';
const cardsKey = (setId: string) => `vocab.review-cards:${setId}`;
const chainKey = (setId: string) => `vocab.review-chain:${setId}`;
const slug = (mode: StudyMode) => mode.toLowerCase();

/** Danh sách chế độ trong tham số `next`, bỏ giá trị lạ và trùng. */
export function parseModeList(value: string | undefined | null): StudyMode[] {
  const modes = (value ?? '')
    .split(',')
    .map((item) => parseStudyMode(item.trim()))
    .filter((mode): mode is StudyMode => mode !== null && REVIEW_MODES.includes(mode));
  return [...new Set(modes)];
}

export function loadReviewModes(): StudyMode[] {
  try {
    const saved = parseModeList(window.localStorage.getItem(MODES_KEY));
    return saved.length ? saved : ['FLASHCARD'];
  } catch {
    return ['FLASHCARD'];
  }
}

export function saveReviewModes(modes: StudyMode[]): void {
  try {
    window.localStorage.setItem(MODES_KEY, modes.map(slug).join(','));
  } catch {
    // Không lưu được thì chỉ dùng trong lần này.
  }
}

const withNext = (params: URLSearchParams, rest: StudyMode[]) => {
  if (rest.length) params.set('next', rest.map(slug).join(','));
  return params.toString();
};

/** Phiên đầu ôn thẻ đến hạn; các chế độ còn lại nằm trong `next`. */
export function reviewHref(setId: string, modes: StudyMode[]): Route {
  const [first = 'FLASHCARD', ...rest] = modes;
  return `/sets/${setId}/study/${slug(first)}?${withNext(new URLSearchParams({ due: '1' }), rest)}` as Route;
}

/**
 * Chế độ tiếp theo ôn đúng các thẻ của phiên đầu (`review=1`), vì sau phiên đầu thẻ đã được
 * dời lịch nên không còn "đến hạn".
 */
export function chainHref(setId: string, modes: StudyMode[]): Route {
  const [first = 'FLASHCARD', ...rest] = modes;
  return `/sets/${setId}/study/${slug(first)}?${withNext(new URLSearchParams({ review: '1' }), rest)}` as Route;
}

export function saveReviewCards(setId: string, cardIds: string[]): void {
  try {
    window.sessionStorage.setItem(cardsKey(setId), JSON.stringify([...new Set(cardIds)]));
  } catch {
    // Không lưu được thì chế độ sau ôn lại thẻ đến hạn nếu còn.
  }
}

export function clearReviewCards(setId: string): void {
  try {
    window.sessionStorage.removeItem(cardsKey(setId));
  } catch {
    // Bỏ qua.
  }
}

export function loadReviewCards(setId: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(window.sessionStorage.getItem(cardsKey(setId)) ?? 'null');
    return Array.isArray(parsed) && parsed.length && parsed.every((id) => typeof id === 'string')
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function saveReviewChain(setId: string, modes: StudyMode[]): void {
  try {
    window.sessionStorage.setItem(chainKey(setId), JSON.stringify(modes));
  } catch {
    // Bỏ qua.
  }
}

/** Chuỗi JSON đã lưu, dùng làm snapshot ổn định cho `useSyncExternalStore`. */
export function readReviewChainRaw(setId: string): string | null {
  try {
    return window.sessionStorage.getItem(chainKey(setId));
  } catch {
    return null;
  }
}

/** Đọc chuỗi chế độ đã lưu, bỏ giá trị lạ; rỗng thì trả `null`. */
export function parseReviewChain(raw: string | null): StudyMode[] | null {
  try {
    const parsed: unknown = JSON.parse(raw ?? 'null');
    if (!Array.isArray(parsed)) return null;
    const modes = parsed.filter((m): m is StudyMode => REVIEW_MODES.includes(m as StudyMode));
    return modes.length ? modes : null;
  } catch {
    return null;
  }
}

export function loadReviewChain(setId: string): StudyMode[] | null {
  return parseReviewChain(readReviewChainRaw(setId));
}

export function clearReviewChain(setId: string): void {
  try {
    window.sessionStorage.removeItem(chainKey(setId));
  } catch {
    // Bỏ qua.
  }
}
