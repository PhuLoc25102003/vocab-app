import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { JoinedClass, MyAssignment } from '@vocab/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { joinClass, leaveClass, listJoinedClasses, listMyAssignments } from '../api';
import { StudentClasses } from './student-classes';

const navigation = vi.hoisted(() => ({ params: new URLSearchParams() }));
vi.mock('next/navigation', () => ({ useSearchParams: () => navigation.params }));
vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api')>()),
  joinClass: vi.fn(),
  leaveClass: vi.fn(),
  listJoinedClasses: vi.fn(),
  listMyAssignments: vi.fn(),
}));

const joined: JoinedClass = {
  id: 'c1',
  name: '10A1',
  description: null,
  teacherName: 'Cô Lan',
  joinedAt: '2026-11-10T00:00:00.000Z',
};
const assignment = (overrides: Partial<MyAssignment>): MyAssignment => ({
  id: 'a1',
  classId: 'c1',
  className: '10A1',
  setId: 's1',
  setTitle: 'Unit 1',
  mode: 'MCQ',
  dueAt: null,
  createdAt: '2026-11-01T00:00:00.000Z',
  status: 'pending',
  completedAt: null,
  modes: ['MCQ'],
  progressStatus: 'todo',
  doneModes: 0,
  ...overrides,
});
const page = <T,>(data: T[]) => ({
  data,
  meta: { page: 1, limit: 100, total: data.length },
  counts: { todo: 0, done: 0, all: data.length },
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <StudentClasses />
    </QueryClientProvider>,
  );
}

describe('StudentClasses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listJoinedClasses).mockResolvedValue(page([joined]));
    vi.mocked(listMyAssignments).mockResolvedValue(
      page([
        assignment({ id: 'a3', setTitle: 'Trễ', progressStatus: 'missed', setId: 's3' }),
        assignment({
          id: 'a2',
          setTitle: 'Viết lại',
          mode: 'WRITE',
          modes: ['WRITE', 'MCQ'],
          doneModes: 1,
          progressStatus: 'in_progress',
          setId: 's2',
        }),
        assignment({ id: 'a1', setTitle: 'Đã xong', progressStatus: 'submitted' }),
      ]),
    );
  });

  it('giữ thứ tự máy chủ, hiện trạng thái bài nộp và số chế độ đã xong', async () => {
    renderPage();

    const links = within(await screen.findByRole('list', { name: 'Bài cần làm' })).getAllByRole(
      'link',
    );
    expect(links.map((link) => link.textContent)).toEqual([
      expect.stringContaining('Bỏ lỡ'),
      expect.stringContaining('Đang làm'),
      expect.stringContaining('Đã nộp'),
    ]);
    expect(links[1]).toHaveTextContent('1/2 chế độ');
    expect(links[1]).toHaveAttribute('href', '/classes/assignments/a2');
    expect(links[1]).toHaveTextContent('Luyện viết');
    expect(links[1]).toHaveTextContent('10A1');
  });

  it('tham gia lớp bằng mã, mã chữ thường vẫn được', async () => {
    vi.mocked(joinClass).mockResolvedValue({ ...joined, id: 'c2', name: '11B2' });
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Tham gia lớp' }));
    const dialog = screen.getByRole('dialog', { name: 'Tham gia lớp' });
    await userEvent.type(within(dialog).getByLabelText('Mã lớp'), ' abc234 ');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Tham gia' }));

    await waitFor(() => expect(joinClass).toHaveBeenCalledWith({ joinCode: 'ABC234' }));
    await waitFor(() => expect(screen.queryByLabelText('Mã lớp')).not.toBeInTheDocument());
  });

  it('báo lỗi mã sai định dạng và mã không có lớp', async () => {
    vi.mocked(joinClass).mockRejectedValue(
      new HttpError('Không tìm thấy lớp', 404, 'CLASS_NOT_FOUND'),
    );
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Tham gia lớp' }));
    const dialog = screen.getByRole('dialog', { name: 'Tham gia lớp' });
    await userEvent.type(within(dialog).getByLabelText('Mã lớp'), 'AB');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Tham gia' }));
    expect(await screen.findByText('Mã lớp gồm 6 ký tự')).toBeInTheDocument();
    expect(joinClass).not.toHaveBeenCalled();

    await userEvent.clear(within(dialog).getByLabelText('Mã lớp'));
    await userEvent.type(within(dialog).getByLabelText('Mã lớp'), 'XYZ567');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Tham gia' }));
    expect(
      await screen.findByText('Không có lớp nào dùng mã này. Hỏi lại giáo viên mã mới nhất.'),
    ).toBeInTheDocument();
  });

  it('rời lớp sau khi xác nhận', async () => {
    vi.mocked(leaveClass).mockResolvedValue();
    renderPage();

    const list = await screen.findByRole('list', { name: 'Lớp đã tham gia' });
    expect(within(list).getByText('Giáo viên Cô Lan')).toBeInTheDocument();
    await userEvent.click(within(list).getByRole('button', { name: 'Rời lớp 10A1' }));
    const dialog = screen.getByRole('dialog', { name: 'Rời lớp 10A1?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Rời lớp' }));

    await waitFor(() => expect(leaveClass).toHaveBeenCalledWith('c1'));
  });

  it('chưa vào lớp nào và chưa có bài thì hướng dẫn nhập mã', async () => {
    vi.mocked(listJoinedClasses).mockResolvedValue(page([]));
    vi.mocked(listMyAssignments).mockResolvedValue(page([]));
    renderPage();

    expect(await screen.findByText('Bạn chưa vào lớp nào')).toBeInTheDocument();
    expect(screen.getByText(/Chưa có bài nào/)).toBeInTheDocument();
  });

  it('lớp đã tham gia đọc số trang từ cpage và có nút chuyển trang', async () => {
    navigation.params = new URLSearchParams('cpage=2');
    vi.mocked(listJoinedClasses).mockResolvedValue({
      data: [joined],
      meta: { page: 2, limit: 20, total: 25 },
    });
    vi.mocked(listMyAssignments).mockResolvedValue(page([]));
    renderPage();

    expect(await screen.findByText('Trang 2/2')).toBeInTheDocument();
    expect(listJoinedClasses).toHaveBeenCalledWith(2);
    expect(screen.getByRole('link', { name: 'Trang trước' })).toHaveAttribute(
      'href',
      '/classes?cpage=1',
    );
    navigation.params = new URLSearchParams();
  });
});
