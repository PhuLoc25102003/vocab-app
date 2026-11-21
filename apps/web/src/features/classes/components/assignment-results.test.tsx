import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Assignment, AssignmentResult, AssignmentSummary } from '@vocab/shared';
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { getAssignmentSummary, listAssignmentResults, listAssignments } from '../api';
import { AssignmentResults } from './assignment-results';

const navigation = vi.hoisted(() => ({ params: new URLSearchParams() }));
vi.mock('next/navigation', () => ({ useSearchParams: () => navigation.params }));
vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api')>()),
  getAssignmentSummary: vi.fn(),
  listAssignmentResults: vi.fn(),
  listAssignments: vi.fn(),
}));

const assignment: Assignment = {
  id: 'a1',
  classId: 'c1',
  setId: 's1',
  setTitle: 'Unit 1',
  mode: 'MCQ',
  modes: ['MCQ', 'WRITE'],
  dueAt: null,
  createdAt: '2026-11-01T00:00:00.000Z',
};
const summary: AssignmentSummary = {
  memberCount: 3,
  doneCount: 2,
  overdueCount: 1,
  submittedCount: 1,
  lateCount: 1,
  missedCount: 1,
  averageScore: 50,
  hardCards: [
    { cardId: 'k1', term: 'banana', definition: 'quả chuối', wrongCount: 2, attemptCount: 3 },
  ],
};
const result = (overrides: Partial<AssignmentResult>): AssignmentResult => ({
  userId: 'u1',
  displayName: 'An',
  status: 'done',
  completedAt: '2026-11-10T03:00:00.000Z',
  correct: 9,
  total: 10,
  progressStatus: 'submitted',
  submission: { submittedAt: '2026-11-10T03:00:00.000Z', score: 85, late: false },
  modeScores: [
    { mode: 'MCQ', done: true, score: 90 },
    { mode: 'WRITE', done: true, score: 80 },
  ],
  ...overrides,
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AssignmentResults classId="c1" assignmentId="a1" />
    </QueryClientProvider>,
  );
}

describe('AssignmentResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listAssignments).mockResolvedValue({
      data: [{ ...assignment, submittedCount: 0, memberCount: 0 }],
      meta: { page: 1, limit: 100, total: 1 },
      counts: { open: 1, closed: 0, all: 1 },
    });
    vi.mocked(getAssignmentSummary).mockResolvedValue(summary);
    vi.mocked(listAssignmentResults).mockResolvedValue({
      data: [
        result({}),
        result({
          userId: 'u2',
          displayName: 'Bình',
          status: 'overdue',
          completedAt: null,
          correct: null,
          total: null,
          progressStatus: 'missed',
          submission: null,
          modeScores: [
            { mode: 'MCQ', done: false, score: null },
            { mode: 'WRITE', done: false, score: null },
          ],
        }),
      ],
      meta: { page: 1, limit: 50, total: 2 },
    });
  });

  it('hiện số liệu cả lớp, từ hay sai và kết quả từng học sinh', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Unit 1' })).toBeInTheDocument();
    expect(screen.getByText('Trắc nghiệm, Luyện viết · không có hạn')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Sai 2/3 lần')).toBeInTheDocument();

    const rows = within(
      await screen.findByRole('list', { name: 'Kết quả từng học sinh' }),
    ).getAllByRole('listitem');
    const studentRows = rows.filter(
      (row) => row.parentElement?.getAttribute('aria-label') === 'Kết quả từng học sinh',
    );
    expect(studentRows[0]).toHaveTextContent('Đã nộp');
    expect(studentRows[0]).toHaveTextContent('Trắc nghiệm 90%');
    expect(studentRows[0]).toHaveTextContent('85%');
    expect(studentRows[1]).toHaveTextContent('Bỏ lỡ');
    expect(studentRows[1]).toHaveTextContent('Chưa nộp');
  });

  it('lọc theo trạng thái nằm trong URL và gửi lên API', async () => {
    navigation.params = new URLSearchParams('status=missed');
    renderPage();

    expect(await screen.findByRole('link', { name: 'Bỏ lỡ', current: 'page' })).toHaveAttribute(
      'href',
      '/classes/c1/assignments/a1?status=missed',
    );
    expect(listAssignmentResults).toHaveBeenCalledWith('c1', 'a1', 1, 'missed');
    navigation.params = new URLSearchParams();
  });

  it('chưa ai làm thì điểm trung bình là "Chưa có" và không có từ hay sai', async () => {
    vi.mocked(getAssignmentSummary).mockResolvedValue({
      ...summary,
      doneCount: 0,
      averageScore: null,
      hardCards: [],
    });
    renderPage();

    expect(await screen.findByText('Chưa có')).toBeInTheDocument();
    expect(screen.getByText('Chưa có từ nào bị trả lời sai.')).toBeInTheDocument();
  });

  it('bài đã huỷ hoặc không phải lớp mình thì báo không tìm thấy', async () => {
    vi.mocked(getAssignmentSummary).mockRejectedValue(
      new HttpError('Không tìm thấy bài giao', 404, 'ASSIGNMENT_NOT_FOUND'),
    );
    renderPage();

    expect(await screen.findByText('Không tìm thấy bài giao')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quay lại lớp' })).toHaveAttribute(
      'href',
      '/classes/c1',
    );
  });

  it('lỗi mạng thì cho thử lại', async () => {
    vi.mocked(getAssignmentSummary).mockRejectedValue(new HttpError('Lỗi', 500, 'INTERNAL_ERROR'));
    renderPage();

    expect(await screen.findByText('Không tải được kết quả')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thử lại/ })).toBeInTheDocument();
  });
});
