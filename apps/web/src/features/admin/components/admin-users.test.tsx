import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AdminUser } from '@vocab/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { listAdminUsers, lockUser, unlockUser } from '../api';
import { AdminUsers } from './admin-users';

const navigation = vi.hoisted(() => ({ params: new URLSearchParams(), push: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
  useSearchParams: () => navigation.params,
}));
vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api')>()),
  listAdminUsers: vi.fn(),
  lockUser: vi.fn(),
  unlockUser: vi.fn(),
}));

const user = (overrides: Partial<AdminUser>): AdminUser => ({
  id: 'u1',
  email: 'hoc@example.com',
  displayName: 'Học sinh',
  role: 'STUDENT',
  createdAt: new Date('2026-11-01'),
  lockedAt: null,
  lockReason: null,
  lockedById: null,
  ...overrides,
});
const page = (data: AdminUser[]) => ({ data, meta: { page: 1, limit: 20, total: data.length } });

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AdminUsers />
    </QueryClientProvider>,
  );
}

describe('AdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.params = new URLSearchParams();
  });

  it('khoá kèm lý do bắt buộc, không có nút khoá cho tài khoản quản trị', async () => {
    vi.mocked(listAdminUsers).mockResolvedValue(
      page([user({}), user({ id: 'a1', email: 'admin@example.com', role: 'ADMIN' })]),
    );
    vi.mocked(lockUser).mockResolvedValue(user({ lockedAt: new Date(), lockReason: 'Spam' }));
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Khoá hoc@example.com' }));
    expect(
      screen.queryByRole('button', { name: 'Khoá admin@example.com' }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Khoá tài khoản' }));
    expect(await screen.findByText('Hãy nhập lý do khoá')).toBeInTheDocument();
    expect(lockUser).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Lý do khoá'), 'Spam');
    await userEvent.click(screen.getByRole('button', { name: 'Khoá tài khoản' }));

    await waitFor(() => expect(lockUser).toHaveBeenCalledWith('u1', 'Spam'));
    expect(listAdminUsers).toHaveBeenCalledTimes(2);
  });

  it('mở khoá tài khoản đang bị khoá và hiện lý do', async () => {
    vi.mocked(listAdminUsers).mockResolvedValue(
      page([user({ lockedAt: new Date(), lockReason: 'Spam' })]),
    );
    vi.mocked(unlockUser).mockResolvedValue(user({}));
    renderPage();

    expect(await screen.findByText('Đã khoá: Spam')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Mở khoá hoc@example.com' }));

    await waitFor(() => expect(unlockUser).toHaveBeenCalledWith('u1'));
  });

  it('tìm kiếm đưa từ khoá lên URL, không có kết quả thì cho xem tất cả', async () => {
    navigation.params = new URLSearchParams('q=xyz');
    vi.mocked(listAdminUsers).mockResolvedValue(page([]));
    renderPage();

    expect(await screen.findByText('Không có ai khớp với “xyz”.')).toBeInTheDocument();
    expect(listAdminUsers).toHaveBeenCalledWith(1, 'xyz');
    await userEvent.click(screen.getByRole('button', { name: 'Xem tất cả' }));
    expect(navigation.push).toHaveBeenCalledWith('/admin/users');
  });

  it('báo không có quyền khi API trả 403', async () => {
    vi.mocked(listAdminUsers).mockRejectedValueOnce(new HttpError('x', 403, 'FORBIDDEN'));
    renderPage();
    expect(await screen.findByText('Bạn không có quyền xem trang này')).toBeInTheDocument();
  });
});
