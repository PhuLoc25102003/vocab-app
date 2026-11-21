import type { StartedSession } from '@vocab/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { useStudyStore } from './session.store';

const started: StartedSession = {
  session: {
    id: 's1',
    setId: 'set1',
    mode: 'FLASHCARD',
    startedAt: '2026-11-19T00:00:00.000Z',
    finishedAt: null,
    correct: 0,
    total: 1,
  },
  questions: [{ id: 'c1', cardId: 'c1', mode: 'FLASHCARD', prompt: 'a', expected: 'b' }],
  languages: { term: 'en', definition: 'vi' },
};
const answer = { questionId: 'c1', value: 'known', timeMs: 1 };
const store = () => useStudyStore.getState();

describe('useStudyStore', () => {
  beforeEach(() => store().begin(started));

  it('chuyển câu và giữ đáp án chờ lưu', () => {
    store().answer(answer);

    expect(store().position).toBe(1);
    expect(store().pending).toEqual([answer]);
  });

  it('không thêm đáp án lần hai khi sang câu sau câu đã chấm', () => {
    store().record(answer);
    expect(store().position).toBe(0);
    expect(store().pending).toEqual([answer]);

    store().answer(answer);

    expect(store().position).toBe(1);
    expect(store().pending).toEqual([answer]);
  });

  it('khôi phục tiến độ và bỏ qua câu đã chấm', () => {
    store().begin(started, { progress: { position: 0, recorded: 0, pending: [answer] } });

    expect(store().position).toBe(1);
    expect(store().pending).toEqual([answer]);
  });

  it('chỉ xoá đáp án của đúng phiên đã được lưu', () => {
    store().answer(answer);

    store().acknowledge('phien-cu', 1);
    expect(store().pending).toHaveLength(1);

    store().acknowledge('s1', 1);
    expect(store().pending).toHaveLength(0);
  });

  it('bắt đầu lại từ đầu với phiên mới', () => {
    store().answer(answer);
    store().begin(started);

    expect(store().position).toBe(0);
    expect(store().pending).toEqual([]);
  });
});
