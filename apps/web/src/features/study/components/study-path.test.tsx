import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ERROR_CODES } from '@vocab/shared';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { accountStudyBackend } from '../api';
import { toPathStep } from '../path-steps';
import { StudyPath } from './study-path';

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: navigation.replace }) }));
vi.mock('../api', () => ({
  accountStudyBackend: {
    resumable: false,
    start: vi.fn(),
    submit: vi.fn(),
    finish: vi.fn(),
  },
}));

function renderPath(step: number) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <StudyPath setId="set1" step={step} />
    </QueryClientProvider>,
  );
}

describe('toPathStep', () => {
  it('đọc bước từ 1, giá trị lạ về bước đầu', () => {
    expect(toPathStep('3')).toBe(2);
    expect(toPathStep(undefined)).toBe(0);
    expect(toPathStep('9')).toBe(0);
    expect(toPathStep('abc')).toBe(0);
  });
});

describe('StudyPath', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hiện các bước, đánh dấu bước đang học và bắt đầu đúng chế độ', async () => {
    vi.mocked(accountStudyBackend.start).mockReturnValue(new Promise(() => undefined));
    renderPath(1);

    const steps = screen.getByRole('list', { name: 'Các bước của lộ trình' });
    expect(steps).toHaveTextContent('Xem thẻ (xong)');
    expect(screen.getByText('Trắc nghiệm').closest('li')).toHaveAttribute('aria-current', 'step');
    await waitFor(() =>
      expect(accountStudyBackend.start).toHaveBeenCalledWith('set1', 'MCQ', { dueOnly: false }),
    );
  });

  it('hiện câu hỏi của bước khi phiên bắt đầu được', async () => {
    vi.mocked(accountStudyBackend.start).mockResolvedValue({
      session: {
        id: 'p1',
        setId: 'set1',
        mode: 'FLASHCARD',
        startedAt: '2026-11-20T00:00:00.000Z',
        finishedAt: null,
        correct: 0,
        total: 1,
      },
      questions: [
        { id: 'c1', cardId: 'c1', mode: 'FLASHCARD', prompt: 'apple', expected: 'quả táo' },
      ],
      languages: { term: 'en', definition: 'vi' },
    });
    renderPath(0);

    expect(await screen.findByText('apple')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Các bước của lộ trình' })).toBeInTheDocument();
  });

  it('bỏ qua bước không dùng được với bộ từ', async () => {
    vi.mocked(accountStudyBackend.start).mockRejectedValue(
      new HttpError('Bộ từ quá ít thẻ', 422, ERROR_CODES.STUDY_MODE_UNAVAILABLE),
    );
    renderPath(2);

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith('/sets/set1/study/path?step=4'),
    );
  });

  it('bước cuối không dùng được thì về trang bộ từ', async () => {
    vi.mocked(accountStudyBackend.start).mockRejectedValue(
      new HttpError('Không có câu hỏi', 422, ERROR_CODES.NO_QUESTIONS_FOR_MODE),
    );
    renderPath(3);

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/sets/set1'));
  });
});
