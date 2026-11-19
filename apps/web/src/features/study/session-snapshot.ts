import {
  startSessionResponseSchema,
  studyProgressSchema,
  type StartedSession,
  type StudyMode,
  type StudyProgress,
} from '@vocab/shared';
import { readUserItem, removeUserItem, writeUserItem } from '@/lib/user-storage';

const MAX_AGE_MS = 12 * 60 * 60 * 1000;

export type ResumableSession = StartedSession & { progress?: StudyProgress };

const startedKey = (key: string) => `${key}:started`;
const progressKey = (key: string) => `${key}:progress`;

export function studySnapshotKey(setId: string, mode: StudyMode, dueOnly: boolean): string {
  return `study:${setId}:${mode}:${dueOnly ? 'due' : 'all'}`;
}

function parseItem<T>(value: string | null, parse: (input: unknown) => T): T | null {
  if (!value) {
    return null;
  }
  try {
    return parse(JSON.parse(value));
  } catch {
    return null;
  }
}

export function loadSnapshot(key: string): ResumableSession | null {
  const started = parseItem(readUserItem(startedKey(key)), (input) =>
    startSessionResponseSchema.shape.data.parse(input),
  );
  const progress = parseItem(readUserItem(progressKey(key)), (input) =>
    studyProgressSchema.parse(input),
  );
  const startedAt = started ? Date.parse(started.session.startedAt) : Number.NaN;
  if (!started || !progress || !(Date.now() - startedAt < MAX_AGE_MS)) {
    clearSnapshot(key);
    return null;
  }
  return { ...started, progress };
}

export function saveStarted(key: string, started: StartedSession): void {
  writeUserItem(startedKey(key), JSON.stringify(started));
}

export function saveProgress(key: string, progress: StudyProgress): void {
  writeUserItem(progressKey(key), JSON.stringify(progress));
}

export function clearSnapshot(key: string): void {
  removeUserItem(startedKey(key));
  removeUserItem(progressKey(key));
}
