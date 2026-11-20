import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Class } from '@vocab/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { getClass, listMembers, regenerateJoinCode, removeMember, updateClass } from '../api';
import { ClassDetail } from './class-detail';

const navigation = vi.hoisted(() => ({ params: new URLSearchParams() }));
vi.mock('next/navigation', () => ({ useSearchParams: () => navigation.params }));
vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api')>()),
  getClass: vi.fn(),
  listMembers: vi.fn(),
  regenerateJoinCode: vi.fn(),
  removeMember: vi.fn(),
  updateClass: vi.fn(),
}));

const klass: Class = {
  id: 'c1',
  name: '10A1',
  description: null,
  joinCode: 'ABC234',
  archivedAt: null,
  createdAt: '2026-11-01T00:00:00.000Z',
  memberCount: 1,
};
const members = {
  data: [{ userId: 'u1', displayName: 'An', joinedAt: '2026-11-10T00:00:00.000Z' }],
  meta: { page: 1, limit: 50, total: 1 },
};

function renderDetail() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ClassDetail id="c1" />
    </QueryClientProvider>,
  );
}

describe('ClassDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getClass).mockResolvedValue(klass);
    vi.mocked(listMembers).mockResolvedValue(members);
  });

  it('hiện mã lớp lớn và danh sách học sinh', async () => {
    renderDetail();

    expect(await screen.findByRole('heading', { name: '10A1' })).toBeInTheDocument();
    expect(screen.getByText('ABC234')).toBeInTheDocument();
    const list = await screen.findByRole('list', { name: 'Học sinh trong lớp' });
    expect(within(list).getByText('An')).toBeInTheDocument();
    expect(within(list).getByText('Vào lớp 10/11/2026')).toBeInTheDocument();
  });

  it('đổi mã sau khi xác nhận', async () => {
    vi.mocked(regenerateJoinCode).mockResolvedValue({ ...klass, joinCode: 'XYZ567' });
    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: 'Đổi mã' }));
    expect(screen.getByRole('dialog', { name: 'Đổi mã lớp?' })).toBeInTheDocument();
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Đổi mã' }),
    );

    await waitFor(() => expect(regenerateJoinCode).toHaveBeenCalledWith('c1'));
  });

  it('xoá học sinh khỏi lớp sau khi xác nhận', async () => {
    vi.mocked(removeMember).mockResolvedValue();
    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: 'Xoá An khỏi lớp' }));
    const dialog = screen.getByRole('dialog', { name: 'Xoá An khỏi lớp?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Xoá khỏi lớp' }));

    await waitFor(() => expect(removeMember).toHaveBeenCalledWith('c1', 'u1'));
  });

  it('lưu trữ lớp sau khi xác nhận', async () => {
    vi.mocked(updateClass).mockResolvedValue({ ...klass, archivedAt: '2026-11-20T00:00:00.000Z' });
    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: 'Lưu trữ lớp' }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Lưu trữ' }),
    );

    await waitFor(() => expect(updateClass).toHaveBeenCalledWith('c1', { archived: true }));
  });

  it('lớp chưa có học sinh thì nhắc gửi mã lớp', async () => {
    vi.mocked(listMembers).mockResolvedValue({ data: [], meta: { page: 1, limit: 50, total: 0 } });
    renderDetail();

    expect(
      await screen.findByText('Gửi mã ABC234 cho học sinh để các em tham gia lớp.'),
    ).toBeInTheDocument();
  });

  it('lớp không phải của mình thì báo không tìm thấy', async () => {
    vi.mocked(getClass).mockRejectedValue(new HttpError('Không có quyền', 403, 'FORBIDDEN'));
    renderDetail();

    expect(await screen.findByText('Không tìm thấy lớp')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quay lại Lớp học' })).toHaveAttribute(
      'href',
      '/classes',
    );
  });
});
