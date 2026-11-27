import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { addPendingSession, clearOfflineData, listPendingSessions } from '@/lib/offline-store';
import type { StudyBackend } from './api';
import { syncPendingSessions } from './offline-sync';

const pending = (setId: string, cardIds: string[]) =>
  addPendingSession({
    setId,
    mode: 'FLASHCARD',
    answers: cardIds.map((id) => ({ questionId: id, value: 'known', timeMs: 500 })),
    finishedAt: '2026-11-20T00:00:00.000Z',
  });

function backend(startImpl: StudyBackend['start']): StudyBackend & { submitted: unknown[] } {
  const submitted: unknown[] = [];
  return {
    submitted,
    start: startImpl,
    submit: vi.fn(async (_id, answers) => {
      submitted.push(...answers);
    }),
    finish: vi.fn(async () => ({ session: {} as never, wrongCardIds: [], xpEarned: 0 })),
  };
}

const started = (questionIds: string[]) =>
  ({
    session: { id: 'server-1' },
    questions: questionIds.map((id) => ({ id })),
    languages: { term: 'en', definition: 'vi' },
  }) as never;

describe('syncPendingSessions', () => {
  afterEach(() => clearOfflineData());

  it('gửi phiên, bỏ đáp án của thẻ đã xoá và xoá khỏi hàng đợi', async () => {
    await pending('s1', ['c1', 'c2']);
    const api = backend(vi.fn(async () => started(['c1'])));

    const result = await syncPendingSessions(api);

    expect(result).toEqual({ synced: 1, dropped: 0, remaining: 0 });
    expect(api.start).toHaveBeenCalledWith('s1', 'FLASHCARD', { cardIds: ['c1', 'c2'] });
    expect(api.submitted).toEqual([{ questionId: 'c1', value: 'known', timeMs: 500 }]);
    expect(api.finish).toHaveBeenCalledWith('server-1');
    expect(await listPendingSessions()).toEqual([]);
  });

  it('bỏ phiên khi bộ đã xoá, giữ lại khi lỗi mạng', async () => {
    await pending('gone', ['c1']);
    await pending('later', ['c2']);
    const api = backend(
      vi.fn(async (setId: string) => {
        if (setId === 'gone') throw new HttpError('x', 404, 'SET_NOT_FOUND');
        throw new TypeError('Failed to fetch');
      }),
    );

    const result = await syncPendingSessions(api);

    expect(result).toEqual({ synced: 0, dropped: 1, remaining: 1 });
    expect((await listPendingSessions()).map(({ setId }) => setId)).toEqual(['later']);
  });
});
