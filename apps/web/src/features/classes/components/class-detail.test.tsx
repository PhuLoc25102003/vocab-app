import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Class } from '@vocab/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import {
  getClass,
  listAssignments,
  listMembers,
  regenerateJoinCode,
  removeMember,
  updateClass,
} from '../api';
import { ClassDetail } from './class-detail';

const navigation = vi.hoisted(() => ({ params: new URLSearchParams() }));
vi.mock('next/navigation', () => ({ useSearchParams: () => navigation.params }));
vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api')>()),
  getClass: vi.fn(),
  listAssignments: vi.fn(),
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
  data: [
    {
      userId: 'u1',
      displayName: 'An',
      joinedAt: '2026-11-10T00:00:00.000Z',
      stats: { onTime: 0, late: 0, missed: 0, pending: 0, averageScore: null, lastActiveAt: null },
    },
  ],
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
    navigation.params = new URLSearchParams();
    vi.mocked(getClass).mockResolvedValue(klass);
    vi.mocked(listMembers).mockResolvedValue(members);
    vi.mocked(listAssignments).mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 100, total: 0 },
    });
  });

  it('tiêu đề có chip mã lớp, số học sinh và tab Bài tập mặc định', async () => {
    renderDetail();

    expect(await screen.findByRole('heading', { name: '10A1' })).toBeInTheDocument();
    expect(screen.getByText('ABC234')).toBeInTheDocument();
    expect(screen.getByText('1 học sinh')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sao chép mã lớp ABC234' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Bài tập' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Học sinh (1)' })).toHaveAttribute(
      'href',
      '/classes/c1?tab=students',
    );
    expect(await screen.findByRole('region', { name: 'Bài đã giao' })).toBeInTheDocument();
    expect(listMembers).not.toHaveBeenCalled();
  });

  it('tab Học sinh nằm trong URL và liệt kê học sinh', async () => {
    navigation.params = new URLSearchParams('tab=students');
    renderDetail();

    const list = await screen.findByRole('list', { name: 'Học sinh trong lớp' });
    expect(within(list).getByText('An')).toBeInTheDocument();
    expect(within(list).getByText('Vào lớp 10/11/2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Học sinh (1)' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('"Mời học sinh" mở modal mã lớn, đổi mã sau khi xác nhận', async () => {
    vi.mocked(regenerateJoinCode).mockResolvedValue({ ...klass, joinCode: 'XYZ567' });
    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: 'Mời học sinh' }));
    const invite = screen.getByRole('dialog', { name: 'Mời học sinh vào 10A1' });
    expect(within(invite).getByText('ABC234')).toBeInTheDocument();
    await userEvent.click(within(invite).getByRole('button', { name: 'Đổi mã' }));
    const confirm = screen.getByRole('dialog', { name: 'Đổi mã lớp?' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Đổi mã' }));

    await waitFor(() => expect(regenerateJoinCode).toHaveBeenCalledWith('c1'));
  });

  it('sửa tên và mô tả lớp trong modal từ menu', async () => {
    vi.mocked(updateClass).mockResolvedValue({ ...klass, name: '10A2' });
    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: 'Thao tác với lớp 10A1' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sửa tên và mô tả' }));
    const dialog = await screen.findByRole('dialog', { name: 'Sửa lớp' });
    const name = within(dialog).getByLabelText('Tên lớp');
    await userEvent.clear(name);
    await userEvent.type(name, '10A2');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Lưu' }));

    await waitFor(() =>
      expect(updateClass).toHaveBeenCalledWith('c1', { name: '10A2', description: '' }),
    );
  });

  it('lưu trữ lớp từ menu sau khi xác nhận', async () => {
    vi.mocked(updateClass).mockResolvedValue({ ...klass, archivedAt: '2026-11-20T00:00:00.000Z' });
    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: 'Thao tác với lớp 10A1' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Lưu trữ lớp' }));
    const dialog = await screen.findByRole('dialog', { name: 'Lưu trữ lớp 10A1?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Lưu trữ' }));

    await waitFor(() => expect(updateClass).toHaveBeenCalledWith('c1', { archived: true }));
  });

  it('xoá học sinh khỏi lớp sau khi xác nhận', async () => {
    navigation.params = new URLSearchParams('tab=students');
    vi.mocked(removeMember).mockResolvedValue();
    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: 'Xoá An khỏi lớp' }));
    const dialog = screen.getByRole('dialog', { name: 'Xoá An khỏi lớp?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Xoá khỏi lớp' }));

    await waitFor(() => expect(removeMember).toHaveBeenCalledWith('c1', 'u1'));
  });

  it('lớp chưa có học sinh thì nhắc gửi mã lớp', async () => {
    navigation.params = new URLSearchParams('tab=students');
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

  it('bài đã giao phân trang, số trang nằm trong URL', async () => {
    navigation.params = new URLSearchParams('apage=3');
    vi.mocked(listAssignments).mockResolvedValue({
      data: [
        {
          id: 'a1',
          classId: 'c1',
          setId: 's1',
          setTitle: 'Unit 1',
          mode: 'MCQ',
          modes: ['MCQ'],
          dueAt: null,
          createdAt: '2026-11-01T00:00:00.000Z',
        },
      ],
      meta: { page: 3, limit: 20, total: 45 },
    });
    renderDetail();

    const assignments = await screen.findByRole('region', { name: 'Bài đã giao' });
    expect(await within(assignments).findByText('Trang 3/3')).toBeInTheDocument();
    expect(listAssignments).toHaveBeenCalledWith('c1', 3);
    expect(within(assignments).getByRole('link', { name: 'Trang trước' })).toHaveAttribute(
      'href',
      '/classes/c1?apage=2',
    );
  });
});
