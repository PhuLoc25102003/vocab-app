import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getAdminStats } from '../api';
import { AdminOverview } from './admin-overview';

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api')>()),
  getAdminStats: vi.fn(),
}));

describe('AdminOverview', () => {
  it('hiện bốn số liệu và lối vào quản lý người dùng', async () => {
    vi.mocked(getAdminStats).mockResolvedValue({
      users: 120,
      lockedUsers: 2,
      sets: 340,
      hiddenSets: 5,
    });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AdminOverview />
      </QueryClientProvider>,
    );

    const tiles = (await screen.findByText('Người dùng')).closest('dl') as HTMLElement;
    expect(within(tiles).getByText('120')).toBeInTheDocument();
    expect(within(tiles).getByText('Bộ bị ẩn')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quản lý người dùng' })).toHaveAttribute(
      'href',
      '/admin/users',
    );
  });
});
