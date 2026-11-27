import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from '@/lib/http';
import { NotificationBell } from './notification-bell';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/lib/http', () => ({ http: vi.fn() }));

const notifications = [
  {
    id: 'n1',
    type: 'ASSIGNMENT_NEW',
    data: { setTitle: 'Unit 5', className: '10A1', dueAt: null },
    href: '/classes/assignments/a1',
    readAt: null,
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
  {
    id: 'n2',
    type: 'BADGE_EARNED',
    data: { code: 'streak-7' },
    href: '/account#badges-title',
    readAt: '2026-11-20T00:00:00.000Z',
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
];

function mockApi({ unread = 1, list = notifications } = {}) {
  vi.mocked(http).mockImplementation(async (path) => {
    if (path === '/notifications/unread-count') return { data: { count: unread } };
    if (String(path).startsWith('/notifications?')) {
      return { data: list, meta: { page: 1, limit: 20, total: list.length } };
    }
    return undefined;
  });
}

function renderBell() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <NotificationBell />
    </QueryClientProvider>,
  );
}

describe('NotificationBell', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hiện số chưa đọc trên nút chuông', async () => {
    mockApi({ unread: 12 });
    renderBell();
    const bell = await screen.findByRole('button', { name: 'Thông báo, 12 chưa đọc' });
    expect(bell).toHaveTextContent('9+');
  });

  it('mở danh sách, bấm thông báo thì đánh dấu đã đọc và mở đúng trang', async () => {
    mockApi();
    renderBell();
    await userEvent.click(await screen.findByRole('button', { name: 'Thông báo, 1 chưa đọc' }));

    const item = await screen.findByRole('menuitem', { name: /Bài tập mới ở lớp 10A1: Unit 5/ });
    expect(
      screen.getByRole('menuitem', { name: /Bạn vừa nhận huy hiệu Một tuần bền bỉ/ }),
    ).toBeInTheDocument();
    await userEvent.click(item);

    expect(http).toHaveBeenCalledWith('/notifications/n1/read', { method: 'PATCH' });
    expect(push).toHaveBeenCalledWith('/classes/assignments/a1');
  });

  it('đánh dấu đã đọc hết', async () => {
    mockApi();
    renderBell();
    await userEvent.click(await screen.findByRole('button', { name: 'Thông báo, 1 chưa đọc' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Đánh dấu đã đọc hết' }));
    expect(http).toHaveBeenCalledWith('/notifications/read-all', { method: 'POST' });
  });

  it('báo trống khi chưa có thông báo', async () => {
    mockApi({ unread: 0, list: [] });
    renderBell();
    await userEvent.click(await screen.findByRole('button', { name: 'Thông báo' }));
    expect(await screen.findByText('Chưa có thông báo nào')).toBeInTheDocument();
  });
});
