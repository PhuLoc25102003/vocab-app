import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { TeacherOverview as Overview } from '@vocab/shared';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTeacherOverview, listClasses, listMySetsForAssigning } from '../api';
import { TeacherOverview } from './teacher-overview';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api')>()),
  getTeacherOverview: vi.fn(),
  listClasses: vi.fn(),
  listMySetsForAssigning: vi.fn(),
}));

const upcoming = {
  assignmentId: 'a1',
  classId: 'c1',
  className: 'Fa1',
  setTitle: 'Unit 3',
  dueAt: '2030-01-01T16:59:00.000Z',
  submitted: 12,
  memberCount: 32,
};
const overview: Overview = {
  classCount: 4,
  studentCount: 132,
  newStudents: 5,
  openAssignmentCount: 6,
  dueSoonCount: 2,
  onTimeRate: 78,
  attention: {
    lowSubmissions: [upcoming],
    missedStreaks: [
      { userId: 'u1', displayName: 'Lan', classId: 'c1', className: 'Fa1', missed: 2 },
    ],
  },
  upcoming: [upcoming],
  recentSubmissions: [
    {
      userId: 'u2',
      displayName: 'Minh',
      classId: 'c1',
      className: 'Fa1',
      assignmentId: 'a1',
      setTitle: 'Unit 3',
      score: 92,
      late: false,
      submittedAt: '2026-11-21T03:00:00.000Z',
    },
  ],
};

function renderOverview() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <TeacherOverview />
    </QueryClientProvider>,
  );
}

describe('TeacherOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listClasses).mockResolvedValue({
      data: [
        {
          id: 'c1',
          name: 'Fa1',
          description: null,
          joinCode: 'ABC234',
          archivedAt: null,
          createdAt: '2026-11-01T00:00:00.000Z',
          memberCount: 32,
          openAssignmentCount: 2,
          onTimeRate: 78,
        },
      ],
      meta: { page: 1, limit: 20, total: 1 },
    });
    vi.mocked(listMySetsForAssigning).mockResolvedValue([]);
  });

  it('hiện ô số liệu, cần chú ý, sắp đến hạn và bài vừa nộp', async () => {
    vi.mocked(getTeacherOverview).mockResolvedValue(overview);
    renderOverview();

    expect(await screen.findByText('132')).toBeInTheDocument();
    expect(screen.getByText('+5 trong 7 ngày')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
    const attention = screen.getByRole('region', { name: 'Cần chú ý' });
    expect(attention).toHaveTextContent('mới nộp 12/32');
    expect(within(attention).getByRole('link', { name: 'Lan' })).toHaveAttribute(
      'href',
      '/classes/c1/members/u1',
    );
    const soon = screen.getByRole('region', { name: 'Sắp đến hạn' });
    expect(within(soon).getByRole('link')).toHaveAttribute('href', '/classes/c1/assignments/a1');
    expect(screen.getByRole('region', { name: 'Bài vừa nộp' })).toHaveTextContent('92%');
  });

  it('không có gì cần nhắc thì ghi "Lớp đang ổn"; Giao bài mở modal có ô chọn lớp', async () => {
    vi.mocked(getTeacherOverview).mockResolvedValue({
      ...overview,
      attention: { lowSubmissions: [], missedStreaks: [] },
    });
    renderOverview();

    expect(await screen.findByText(/Lớp đang ổn/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Giao bài' }));
    const dialog = await screen.findByRole('dialog', { name: 'Giao bài' });
    expect(within(dialog).getByRole('combobox', { name: 'Lớp' })).toBeInTheDocument();
  });

  it('chưa có lớp thì hướng dẫn 3 bước và nút chính là Tạo lớp', async () => {
    vi.mocked(getTeacherOverview).mockResolvedValue({
      ...overview,
      classCount: 0,
      studentCount: 0,
      upcoming: [],
      recentSubmissions: [],
    });
    renderOverview();

    expect(await screen.findByText('Bắt đầu dạy trong 3 bước')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tạo lớp' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Giao bài' })).not.toBeInTheDocument();
  });
});
