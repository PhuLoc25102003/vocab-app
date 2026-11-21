import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ERROR_CODES, type MyAssignmentDetail } from '@vocab/shared';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { getMyAssignment, submitMyAssignment } from '../api';
import { AssignmentWork, progressStatusOf } from './assignment-work';

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api')>()),
  getMyAssignment: vi.fn(),
  submitMyAssignment: vi.fn(),
}));

const detail = (overrides: Partial<MyAssignmentDetail> = {}): MyAssignmentDetail => ({
  id: 'a1',
  classId: 'c1',
  className: '10A1',
  setId: 's1',
  setTitle: 'Unit 1',
  modes: ['FLASHCARD', 'MCQ', 'MATCH'],
  dueAt: null,
  createdAt: '2026-11-01T00:00:00.000Z',
  progress: [
    { mode: 'FLASHCARD', done: true, score: null },
    { mode: 'MCQ', done: false, score: null },
    { mode: 'MATCH', done: false, score: null },
  ],
  submission: null,
  canSubmit: false,
  ...overrides,
});

const allDone = detail({
  progress: [
    { mode: 'FLASHCARD', done: true, score: null },
    { mode: 'MCQ', done: true, score: 80 },
    { mode: 'MATCH', done: true, score: 90 },
  ],
  canSubmit: true,
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AssignmentWork assignmentId="a1" />
    </QueryClientProvider>,
  );
}

describe('progressStatusOf', () => {
  const now = Date.parse('2026-11-21T00:00:00.000Z');
  it('tính trạng thái từ bài nộp, hạn và tiến độ', () => {
    expect(progressStatusOf(detail({ progress: [] }), now)).toBe('todo');
    expect(progressStatusOf(detail(), now)).toBe('in_progress');
    expect(progressStatusOf(detail({ dueAt: '2026-11-20T00:00:00.000Z' }), now)).toBe('missed');
    const submission = { submittedAt: '2026-11-20T00:00:00.000Z', score: 85, late: true };
    expect(progressStatusOf(detail({ submission }), now)).toBe('late');
  });
});

describe('AssignmentWork', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nút chính đưa tới chế độ chưa xong đầu tiên, phiên mang mã bài', async () => {
    vi.mocked(getMyAssignment).mockResolvedValue(detail());
    renderPage();

    const next = await screen.findByRole('link', { name: /Tiếp tục: Trắc nghiệm/ });
    expect(next).toHaveAttribute('href', '/sets/s1/study/mcq?assignment=a1');
    expect(screen.getByText('1/3 chế độ đã xong')).toBeInTheDocument();
    const modes = within(screen.getByRole('list')).getAllByRole('link');
    expect(modes).toHaveLength(3);
    expect(modes[0]).toHaveTextContent('Làm lại');
    expect(screen.queryByRole('button', { name: 'Nộp bài' })).not.toBeInTheDocument();
  });

  it('xong mọi chế độ thì nộp bài sau khi xác nhận', async () => {
    const user = userEvent.setup();
    vi.mocked(getMyAssignment)
      .mockResolvedValueOnce(allDone)
      .mockResolvedValue({
        ...allDone,
        canSubmit: false,
        submission: { submittedAt: '2026-11-20T14:05:00.000Z', score: 85, late: false },
      });
    vi.mocked(submitMyAssignment).mockResolvedValue({
      submittedAt: '2026-11-20T14:05:00.000Z',
      score: 85,
      late: false,
    });
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Nộp bài' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Nộp bài' }));

    expect(submitMyAssignment).toHaveBeenCalledWith('a1');
    expect(await screen.findByText('85%')).toBeInTheDocument();
    expect(screen.getByText(/Đã nộp lúc/)).toBeInTheDocument();
  });

  it('báo bài không tìm thấy', async () => {
    vi.mocked(getMyAssignment).mockRejectedValue(
      new HttpError('Không tìm thấy bài giao', 404, ERROR_CODES.ASSIGNMENT_NOT_FOUND),
    );
    renderPage();

    expect(await screen.findByText('Không tìm thấy bài tập')).toBeInTheDocument();
  });
});
