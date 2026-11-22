import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { getAdminStats } from '../api';
import { AdminOverview } from './admin-overview';

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api')>()),
  getAdminStats: vi.fn(),
}));

describe('AdminOverview', () => {
  it('hiện ô số liệu, biểu đồ 30 ngày, việc cần xử lý, vai trò và hàng chờ rà', async () => {
    vi.mocked(getAdminStats).mockResolvedValue({
      users: 1204,
      lockedUsers: 3,
      sets: 860,
      hiddenSets: 2,
      newUsers: 48,
      activeUsers: 312,
      sessions: 2410,
      publicSets: 214,
      roles: { STUDENT: 1150, TEACHER: 50, ADMIN: 4 },
      daily: [
        { day: '2026-11-20', signups: 4, active: 30 },
        { day: '2026-11-21', signups: 7, active: 41 },
      ],
      recentUsers: [
        {
          id: 'u1',
          displayName: 'Lan',
          email: 'lan@example.com',
          role: 'STUDENT',
          createdAt: '2026-11-21T00:00:00.000Z',
        },
      ],
      newPublicSets: [
        {
          id: 's1',
          title: 'IELTS 7.0',
          ownerName: 'Minh',
          cardCount: 40,
          createdAt: '2026-11-20T00:00:00.000Z',
        },
      ],
    });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AdminOverview />
      </QueryClientProvider>,
    );

    const tiles = (await screen.findByText('Người dùng')).closest('dl') as HTMLElement;
    expect(within(tiles).getByText('1.204')).toBeInTheDocument();
    expect(within(tiles).getByText('+48 trong 7 ngày')).toBeInTheDocument();
    expect(within(tiles).getByText('214 công khai')).toBeInTheDocument();

    const chart = screen.getByRole('region', { name: '30 ngày qua' });
    expect(within(chart).getByText('Tổng 30 ngày: 11')).toBeInTheDocument();
    await userEvent.hover(within(chart).getByRole('button', { name: '21/11: 41 người' }));
    expect(within(chart).getByText('21/11: 41 người')).toBeInTheDocument();
    expect(within(chart).getAllByRole('table')).toHaveLength(2);

    expect(screen.getByRole('region', { name: 'Cần xử lý' })).toHaveTextContent(
      '3 tài khoản đang khoá',
    );
    expect(screen.getByRole('region', { name: 'Vai trò' })).toHaveTextContent('1.150');
    const review = screen.getByRole('region', { name: 'Bộ công khai mới' });
    expect(within(review).getByRole('link', { name: 'IELTS 7.0' })).toHaveAttribute(
      'href',
      '/sets/s1',
    );
    expect(within(review).getByRole('button', { name: /Ẩn/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Trang quản lý' })).toHaveAttribute(
      'href',
      '/admin/users',
    );
  });
});
