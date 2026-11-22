import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AdminClassesOverview } from '@vocab/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAdminClassesOverview } from '../api';
import { AdminClasses } from './admin-classes';

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api')>()),
  getAdminClassesOverview: vi.fn(),
}));

const mockOverview: AdminClassesOverview = {
  totalClasses: 1,
  totalStudentsInClasses: 2,
  totalUnassignedStudents: 1,
  classes: [
    {
      id: 'c1',
      name: 'Tiếng Anh 8A1',
      description: 'Lớp 8 nâng cao',
      joinCode: 'ABCXYZ',
      archivedAt: null,
      createdAt: new Date('2026-11-20T00:00:00.000Z'),
      teacher: {
        id: 't1',
        displayName: 'Thầy Hưng',
        email: 'teacher@example.com',
      },
      memberCount: 2,
      assignmentCount: 3,
      members: [
        {
          id: 's1',
          displayName: 'Nguyễn Văn A',
          email: 's1@example.com',
          joinedAt: new Date('2026-11-21T00:00:00.000Z'),
        },
        {
          id: 's2',
          displayName: 'Lê Văn B',
          email: 's2@example.com',
          joinedAt: new Date('2026-11-21T00:00:00.000Z'),
        },
      ],
    },
  ],
  unassignedStudents: [
    {
      id: 's3',
      displayName: 'Trần Thị C',
      email: 's3@example.com',
      createdAt: new Date('2026-11-22T00:00:00.000Z'),
    },
  ],
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AdminClasses />
    </QueryClientProvider>,
  );
}

describe('AdminClasses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hiển thị 3 thẻ thống kê tổng quan và thông tin lớp học theo giáo viên', async () => {
    vi.mocked(getAdminClassesOverview).mockResolvedValue(mockOverview);

    renderPage();

    expect(await screen.findByText('Tổng số lớp học')).toBeInTheDocument();
    expect(screen.getByText('Học sinh trong lớp')).toBeInTheDocument();
    expect(screen.getByText('Học sinh chưa có lớp')).toBeInTheDocument();

    // Thông tin lớp học
    expect(screen.getByText('Tiếng Anh 8A1')).toBeInTheDocument();
    expect(screen.getByText('Thầy Hưng')).toBeInTheDocument();
    expect(screen.getByText(/Mã: ABCXYZ/i)).toBeInTheDocument();
    expect(screen.getByText(/2 học sinh/i)).toBeInTheDocument();

    // Học sinh chưa có lớp
    expect(screen.getByText('Trần Thị C')).toBeInTheDocument();
    expect(screen.getByText('s3@example.com')).toBeInTheDocument();
  });

  it('mở rộng danh sách học sinh của một lớp khi bấm Xem học sinh', async () => {
    const user = userEvent.setup();
    vi.mocked(getAdminClassesOverview).mockResolvedValue(mockOverview);

    renderPage();

    const viewBtn = await screen.findByRole('button', { name: /Xem học sinh/i });
    await user.click(viewBtn);

    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('Lê Văn B')).toBeInTheDocument();
  });

  it('lọc danh sách lớp học theo từ khoá tìm kiếm', async () => {
    const user = userEvent.setup();
    vi.mocked(getAdminClassesOverview).mockResolvedValue(mockOverview);

    renderPage();

    const searchInput = await screen.findByPlaceholderText(
      /Tìm theo tên lớp, mã lớp hoặc giáo viên/i,
    );
    await user.type(searchInput, 'Không tồn tại');

    expect(screen.queryByText('Tiếng Anh 8A1')).not.toBeInTheDocument();
    expect(screen.getByText('Chưa có lớp học nào')).toBeInTheDocument();
  });
});
