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
  totalTeachers: 1,
  totalClasses: 1,
  totalStudentsInClasses: 2,
  totalUnassignedStudents: 1,
  teachers: [
    {
      id: 't1',
      displayName: 'Thầy Hưng',
      email: 'teacher@example.com',
      createdAt: new Date('2026-11-19T00:00:00.000Z'),
      classCount: 1,
      totalStudents: 2,
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
    },
  ],
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
      lockedAt: null,
      lockReason: null,
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

  it('hiển thị 3 thẻ thống kê tổng quan và thông tin danh sách giáo viên', async () => {
    vi.mocked(getAdminClassesOverview).mockResolvedValue(mockOverview);

    renderPage();

    expect(await screen.findByText('Tổng số lớp học')).toBeInTheDocument();
    expect(screen.getByText('Học sinh trong lớp')).toBeInTheDocument();
    expect(screen.getByText('Học sinh chưa có lớp')).toBeInTheDocument();

    // Thông tin giáo viên
    expect(screen.getByText('Thầy Hưng')).toBeInTheDocument();
    expect(screen.getByText('teacher@example.com')).toBeInTheDocument();
    expect(screen.getByText(/1 lớp/i)).toBeInTheDocument();

    // Học sinh chưa có lớp
    expect(screen.getByText('Trần Thị C')).toBeInTheDocument();
    expect(screen.getByText('s3@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Khoá' })).toBeInTheDocument();
  });

  it('mở rộng danh sách lớp học và học sinh của giáo viên', async () => {
    const user = userEvent.setup();
    vi.mocked(getAdminClassesOverview).mockResolvedValue(mockOverview);

    renderPage();

    const viewClassesBtn = await screen.findByRole('button', { name: /Xem lớp học/i });
    await user.click(viewClassesBtn);

    expect(screen.getByText('Tiếng Anh 8A1')).toBeInTheDocument();
    expect(screen.getByText(/Mã: ABCXYZ/i)).toBeInTheDocument();

    const viewStudentsBtn = screen.getByRole('button', { name: /Xem học sinh/i });
    await user.click(viewStudentsBtn);

    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('Lê Văn B')).toBeInTheDocument();
  });

  it('lọc danh sách lớp học theo từ khoá tìm kiếm', async () => {
    const user = userEvent.setup();
    vi.mocked(getAdminClassesOverview).mockResolvedValue(mockOverview);

    renderPage();

    const searchInput = await screen.findByPlaceholderText(
      /Tìm theo tên giáo viên, email hoặc lớp học/i,
    );
    await user.type(searchInput, 'Không tồn tại');

    expect(screen.queryByText('Thầy Hưng')).not.toBeInTheDocument();
    expect(
      screen.getByText('Không tìm thấy giáo viên hoặc lớp học nào khớp với từ khoá.'),
    ).toBeInTheDocument();
  });
});
