import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AdminUser } from '@vocab/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { listAdminUsers, lockUser, setUserRole, unlockUser } from '../api';
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
  setUserRole: vi.fn(),
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
  isOnline: false,
  lastActiveAt: null,
  recentSets: [],
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

  it('tìm kiếm đưa từ khoá lên URL, không có kết quả thì cho xoá bộ lọc', async () => {
    navigation.params = new URLSearchParams('q=xyz&role=TEACHER');
    vi.mocked(listAdminUsers).mockResolvedValue(page([]));
    renderPage();

    expect(await screen.findByText('Không có ai khớp với “xyz”.')).toBeInTheDocument();
    expect(listAdminUsers).toHaveBeenCalledWith({
      q: 'xyz',
      role: 'TEACHER',
      status: undefined,
      sort: '-createdAt',
      page: 1,
    });
    expect(screen.getByRole('link', { name: 'Xoá bộ lọc' })).toHaveAttribute(
      'href',
      '/admin/users',
    );

    const search = screen.getByRole('searchbox', { name: 'Tìm theo email hoặc tên' });
    await userEvent.clear(search);
    await userEvent.type(search, 'lan{Enter}');
    expect(navigation.push).toHaveBeenCalledWith('/admin/users?q=lan&role=TEACHER');
  });

  it('lọc theo trạng thái và vai trò, bỏ qua giá trị sai trên URL', async () => {
    navigation.params = new URLSearchParams('status=locked&role=OWNER&sort=x&page=2');
    vi.mocked(listAdminUsers).mockResolvedValue({
      data: [user({ lockedAt: new Date(), lockReason: 'Spam' })],
      meta: { page: 2, limit: 20, total: 41 },
    });
    renderPage();

    expect(await screen.findByText('21–40 trên 41')).toBeInTheDocument();
    expect(listAdminUsers).toHaveBeenCalledWith({
      q: '',
      role: undefined,
      status: 'locked',
      sort: '-createdAt',
      page: 2,
    });
    expect(screen.getByRole('link', { name: 'Đã khoá' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Tất cả' })).toHaveAttribute('href', '/admin/users');

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Lọc theo vai trò' }),
      'TEACHER',
    );
    expect(navigation.push).toHaveBeenCalledWith('/admin/users?role=TEACHER&status=locked');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Sắp xếp' }), 'displayName');
    expect(navigation.push).toHaveBeenCalledWith('/admin/users?status=locked&sort=displayName');
  });

  it('báo không có quyền khi API trả 403', async () => {
    vi.mocked(listAdminUsers).mockRejectedValueOnce(new HttpError('x', 403, 'FORBIDDEN'));
    renderPage();
    expect(await screen.findByText('Bạn không có quyền xem trang này')).toBeInTheDocument();
  });

  it('ADMIN đổi vai trò thành giáo viên ngay trên dòng người dùng', async () => {
    vi.mocked(listAdminUsers).mockResolvedValue(page([user({})]));
    vi.mocked(setUserRole).mockResolvedValue(user({ role: 'TEACHER' }));
    renderPage();

    const select = await screen.findByRole('combobox', { name: 'Vai trò của hoc@example.com' });
    expect(select).toHaveValue('STUDENT');
    await userEvent.selectOptions(select, 'TEACHER');

    await waitFor(() => expect(setUserRole).toHaveBeenCalledWith('u1', 'TEACHER'));
  });

  it('báo lỗi khi máy chủ từ chối đổi vai trò', async () => {
    vi.mocked(listAdminUsers).mockResolvedValue(page([user({ role: 'ADMIN' })]));
    vi.mocked(setUserRole).mockRejectedValue(
      new HttpError('Bạn không thể tự đổi vai trò của mình', 422, 'CANNOT_CHANGE_OWN_ROLE'),
    );
    renderPage();

    await userEvent.selectOptions(
      await screen.findByRole('combobox', { name: 'Vai trò của hoc@example.com' }),
      'STUDENT',
    );

    await waitFor(() => expect(setUserRole).toHaveBeenCalledWith('u1', 'STUDENT'));
  });

  it('hiển thị trạng thái online và mở xem các bộ từ học gần đây', async () => {
    vi.mocked(listAdminUsers).mockResolvedValue(
      page([
        user({
          id: 'u2',
          displayName: 'Mai',
          email: 'mai@example.com',
          isOnline: true,
          recentSets: [
            {
              setId: 's1',
              title: 'Unit 1 Leisure time',
              cardCount: 20,
              mode: 'SPEAK',
              startedAt: new Date('2026-11-20T10:00:00Z'),
              correct: 1,
              total: 1,
              modes: [
                {
                  mode: 'SPEAK',
                  startedAt: new Date('2026-11-20T10:00:00Z'),
                  finishedAt: new Date('2026-11-20T10:05:00Z'),
                  answered: 1,
                  correct: 1,
                  total: 1,
                },
                {
                  mode: 'FLASHCARD',
                  startedAt: new Date('2026-11-20T09:00:00Z'),
                  finishedAt: null,
                  answered: 8,
                  correct: 6,
                  total: 20,
                },
              ],
            },
          ],
        }),
      ]),
    );
    renderPage();

    expect(await screen.findByText('Online')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: '1 bộ gần đây' });
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);

    expect(await screen.findByText('Bộ từ gần đây của Mai')).toBeInTheDocument();
    expect(screen.getByText('Unit 1 Leisure time')).toBeInTheDocument();
    expect(screen.getByText('20 từ')).toBeInTheDocument();
    expect(screen.getByText('Đã học 1/20 từ')).toBeInTheDocument();
    expect(screen.getByText('Đúng 1/1 (100%)')).toBeInTheDocument();
    expect(screen.getByText('Đã học 8/20 từ')).toBeInTheDocument();
    expect(screen.getByText('Đúng 6/8 (75%)')).toBeInTheDocument();

    // Bấm vào link bộ từ phải đóng modal để không khoá click ở trang mới
    await userEvent.click(screen.getByRole('link', { name: 'Unit 1 Leisure time' }));
    expect(screen.queryByText('Bộ từ gần đây của Mai')).not.toBeInTheDocument();
  });
});
