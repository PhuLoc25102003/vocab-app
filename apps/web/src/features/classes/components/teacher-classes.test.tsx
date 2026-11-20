import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Class } from '@vocab/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { createClass, listClasses } from '../api';
import { TeacherClasses } from './teacher-classes';

const navigation = vi.hoisted(() => ({ params: new URLSearchParams(), push: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
  useSearchParams: () => navigation.params,
}));
vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api')>()),
  listClasses: vi.fn(),
  createClass: vi.fn(),
}));

const klass = (overrides: Partial<Class> = {}): Class => ({
  id: 'c1',
  name: '10A1',
  description: 'Tiếng Anh cơ bản',
  joinCode: 'ABC234',
  archivedAt: null,
  createdAt: '2026-11-01T00:00:00.000Z',
  memberCount: 12,
  ...overrides,
});
const page = (data: Class[]) => ({ data, meta: { page: 1, limit: 20, total: data.length } });

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <TeacherClasses />
    </QueryClientProvider>,
  );
}

describe('TeacherClasses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.params = new URLSearchParams();
  });

  it('liệt kê lớp đang dạy kèm số học sinh và mã lớp', async () => {
    vi.mocked(listClasses).mockResolvedValue(page([klass()]));
    renderPage();

    const link = await screen.findByRole('link', { name: /10A1/ });
    expect(link).toHaveAttribute('href', '/classes/c1');
    expect(link).toHaveTextContent('12 học sinh');
    expect(link).toHaveTextContent('ABC234');
    expect(listClasses).toHaveBeenCalledWith(false, 1);
    expect(screen.getByRole('link', { name: 'Đang dạy' })).toHaveAttribute('aria-current', 'page');
  });

  it('lọc lớp đã lưu trữ theo đường dẫn và báo trống', async () => {
    navigation.params = new URLSearchParams('archived=1');
    vi.mocked(listClasses).mockResolvedValue(page([]));
    renderPage();

    expect(await screen.findByText('Chưa có lớp nào đã lưu trữ')).toBeInTheDocument();
    expect(listClasses).toHaveBeenCalledWith(true, 1);
  });

  it('chưa có lớp thì mời tạo, lỗi mạng thì cho thử lại', async () => {
    vi.mocked(listClasses).mockResolvedValueOnce(page([]));
    renderPage();
    expect(await screen.findByText('Bạn chưa có lớp nào')).toBeInTheDocument();

    vi.mocked(listClasses).mockRejectedValue(new HttpError('Lỗi', 500, 'INTERNAL_ERROR'));
    navigation.params = new URLSearchParams('page=2');
    renderPage();
    expect(await screen.findByText('Không tải được lớp học')).toBeInTheDocument();
  });

  it('tạo lớp rồi tới trang lớp mới', async () => {
    vi.mocked(listClasses).mockResolvedValue(page([]));
    vi.mocked(createClass).mockResolvedValue(klass({ id: 'c9', name: '11B2', memberCount: 0 }));
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Tạo lớp' }));
    const dialog = screen.getByRole('dialog', { name: 'Tạo lớp' });
    expect(within(dialog).getByLabelText('Tên lớp')).toHaveFocus();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Tạo lớp' }));
    expect(await within(dialog).findByText('Hãy nhập tên lớp')).toBeInTheDocument();
    expect(createClass).not.toHaveBeenCalled();

    await userEvent.type(within(dialog).getByLabelText('Tên lớp'), '  11B2 ');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Tạo lớp' }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/classes/c9'));
    expect(screen.queryByRole('dialog', { name: 'Tạo lớp' })).not.toBeInTheDocument();
    expect(vi.mocked(createClass).mock.calls[0]?.[0]).toEqual({ name: '11B2' });
  });
});
