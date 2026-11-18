import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Question, SessionResult, StartedSession } from '@vocab/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import type { StudyBackend } from '../api';
import type { StudyModeProps } from '../modes/views';
import { useStudyStore } from '../session.store';
import { StudyShell } from './study-shell';

vi.mock('../modes/views', () => ({
  STUDY_VIEWS: {
    FLASHCARD: ({ question, onAnswer }: StudyModeProps) => (
      <button onClick={() => onAnswer({ questionId: question.id, value: 'known', timeMs: 5 })}>
        Trả lời {question.prompt}
      </button>
    ),
  },
}));

const question = (id: string, prompt: string): Question => ({
  id,
  cardId: id,
  mode: 'FLASHCARD',
  prompt,
  expected: `nghĩa ${prompt}`,
});
const session = {
  id: 's1',
  setId: 'set1',
  mode: 'FLASHCARD' as const,
  startedAt: '2026-11-19T00:00:00.000Z',
  finishedAt: null,
  correct: 0,
  total: 2,
};
const started: StartedSession = {
  session,
  questions: [question('c1', 'apple'), question('c2', 'pear')],
};
const result: SessionResult = {
  session: { ...session, finishedAt: '2026-11-19T00:01:00.000Z', correct: 1, total: 2 },
  wrongCardIds: ['c2'],
};

function setup(overrides: Partial<StudyBackend> = {}) {
  const backend: StudyBackend = {
    start: vi.fn().mockResolvedValue(started),
    submit: vi.fn().mockResolvedValue(undefined),
    finish: vi.fn().mockResolvedValue(result),
    ...overrides,
  };
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <StudyShell backend={backend} setId="set1" mode="FLASHCARD" exitHref="/sets" />
    </QueryClientProvider>,
  );
  return backend;
}

const answerAll = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Trả lời apple' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Trả lời pear' }));
};

describe('StudyShell', () => {
  beforeEach(() => {
    useStudyStore.setState({
      session: null,
      questions: [],
      position: 0,
      pending: [],
      result: null,
    });
  });

  it('đi qua các câu, lưu đáp án rồi hiện kết quả', async () => {
    const backend = setup();

    expect(await screen.findByText('0/2')).toBeInTheDocument();
    await answerAll();

    expect(await screen.findByText('Đã xong phiên học')).toBeInTheDocument();
    expect(backend.submit).toHaveBeenCalledWith('s1', [
      { questionId: 'c1', value: 'known', timeMs: 5 },
      { questionId: 'c2', value: 'known', timeMs: 5 },
    ]);
    expect(backend.finish).toHaveBeenCalledTimes(1);
    expect(screen.getByText('pear')).toBeInTheDocument();
    expect(screen.queryByText('apple')).not.toBeInTheDocument();
  });

  it('giữ đáp án khi lưu lỗi và gửi lại khi thử lại', async () => {
    const submit = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
    const backend = setup({ submit });

    await answerAll();
    await userEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Đã xong phiên học')).toBeInTheDocument();
    expect(submit).toHaveBeenCalledTimes(2);
    expect(submit.mock.calls[1]?.[1]).toHaveLength(2);
    expect(backend.finish).toHaveBeenCalledTimes(1);
  });

  it('học lại bằng một phiên mới', async () => {
    const start = vi
      .fn()
      .mockResolvedValueOnce(started)
      .mockResolvedValue({ ...started, session: { ...session, id: 's2' } });
    setup({ start });

    await answerAll();
    await userEvent.click(await screen.findByRole('button', { name: 'Học lại' }));

    expect(await screen.findByRole('button', { name: 'Trả lời apple' })).toBeInTheDocument();
    await waitFor(() => expect(useStudyStore.getState().session?.id).toBe('s2'));
    expect(start).toHaveBeenCalledTimes(2);
  });

  it('báo bộ từ chưa có thẻ', async () => {
    setup({
      start: vi.fn().mockRejectedValue(new HttpError('x', 422, 'SET_HAS_NO_CARDS')),
    });

    expect(await screen.findByText('Bộ từ chưa có thẻ')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quay lại' })).toHaveAttribute('href', '/sets');
  });

  it('cho thử lại khi không bắt đầu được', async () => {
    const start = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(started);
    setup({ start });

    await userEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByRole('button', { name: 'Trả lời apple' })).toBeInTheDocument();
  });
});
