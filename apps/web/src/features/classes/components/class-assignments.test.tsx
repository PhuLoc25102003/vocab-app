import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ClassAssignment, SetSummary } from '@vocab/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Route } from 'next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import {
  createAssignment,
  listAssignments,
  listMySetsForAssigning,
  removeAssignment,
} from '../api';
import { type AssignmentsView, ClassAssignments } from './class-assignments';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: navigation.push }) }));

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api')>()),
  createAssignment: vi.fn(),
  listAssignments: vi.fn(),
  listMySetsForAssigning: vi.fn(),
  removeAssignment: vi.fn(),
}));

const assignment = (overrides: Partial<ClassAssignment> = {}): ClassAssignment => ({
  id: 'a1',
  classId: 'c1',
  setId: 's1',
  setTitle: 'Unit 1',
  mode: 'MCQ',
  dueAt: null,
  createdAt: '2026-11-01T00:00:00.000Z',
  submittedCount: 0,
  memberCount: 0,
  ...overrides,
});
const set = (overrides: Partial<SetSummary>): SetSummary => ({
  id: 's1',
  ownerId: 'u1',
  title: 'Unit 1',
  description: null,
  termLang: 'en',
  defLang: 'vi',
  visibility: 'PUBLIC',
  cardCount: 12,
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
  ...overrides,
});
const list = (data: ClassAssignment[]) => ({
  data,
  meta: { page: 1, limit: 100, total: data.length },
  counts: { open: data.length, closed: 0, all: data.length },
});

function renderSection(archived = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ClassAssignments classId="c1" archived={archived} />
    </QueryClientProvider>,
  );
}

describe('ClassAssignments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listMySetsForAssigning).mockResolvedValue([
      set({}),
      set({ id: 's2', title: 'Nháp', visibility: 'PRIVATE' }),
    ]);
  });

  it('liệt kê bài đã giao với trạng thái hạn, chế độ, số đã nộp x/y', async () => {
    vi.mocked(listAssignments).mockResolvedValue(
      list([
        assignment({ dueAt: '2020-01-01T16:59:00.000Z', submittedCount: 3, memberCount: 25 }),
        assignment({ id: 'a2', setTitle: 'Unit 2', mode: 'WRITE', modes: ['WRITE', 'MCQ'] }),
        assignment({ id: 'a3', setTitle: 'Unit 3', dueAt: '2099-01-01T00:00:00.000Z' }),
      ]),
    );
    renderSection();

    const rows = within(await screen.findByRole('list', { name: 'Bài đã giao' })).getAllByRole(
      'listitem',
    );
    expect(rows[0]).toHaveTextContent('Hết hạn');
    expect(rows[0]).toHaveTextContent('Trắc nghiệm');
    expect(rows[0]).toHaveTextContent('3/25 đã nộp');
    expect(within(rows[0]!).getByRole('link')).toHaveAttribute(
      'href',
      '/classes/c1/assignments/a1',
    );
    expect(rows[1]).toHaveTextContent('Không hạn');
    expect(rows[1]).toHaveTextContent('Luyện viết +1');
    expect(rows[1]).toHaveTextContent('Không có hạn');
    expect(rows[2]).toHaveTextContent('Còn hạn');
  });

  it('tab còn hạn, hết hạn có số bài; tìm và sắp xếp đưa vào URL', async () => {
    vi.mocked(listAssignments).mockResolvedValue({
      ...list([assignment({})]),
      counts: { open: 2, closed: 5, all: 7 },
    });
    const hrefFor = ({ status, q, sort, page }: AssignmentsView) =>
      `/x?s=${status}&q=${q}&o=${sort}&p=${page}` as Route;
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <ClassAssignments
          classId="c1"
          archived={false}
          view={{ status: 'closed', q: '', sort: 'due', page: 2 }}
          hrefFor={hrefFor}
        />
      </QueryClientProvider>,
    );

    await screen.findByRole('list', { name: 'Bài đã giao' });
    expect(listAssignments).toHaveBeenCalledWith('c1', 2, {
      status: 'closed',
      q: undefined,
      sort: 'due',
    });
    const tabs = screen.getByRole('navigation', { name: 'Lọc theo trạng thái' });
    expect(within(tabs).getByRole('link', { name: 'Còn hạn (2)' })).toHaveAttribute(
      'href',
      '/x?s=open&q=&o=due&p=1',
    );
    expect(within(tabs).getByRole('link', { name: 'Hết hạn (5)' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Tìm theo tên bộ từ' }),
      'unit{Enter}',
    );
    expect(navigation.push).toHaveBeenLastCalledWith('/x?s=closed&q=unit&o=due&p=1');
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Sắp xếp bài đã giao' }),
      '-createdAt',
    );
    expect(navigation.push).toHaveBeenLastCalledWith('/x?s=closed&q=&o=-createdAt&p=1');
  });

  it('tìm không ra bài thì cho xoá bộ lọc', async () => {
    vi.mocked(listAssignments).mockResolvedValue(list([]));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <ClassAssignments
          classId="c1"
          archived={false}
          view={{ status: 'all', q: 'zzz', sort: 'due', page: 1 }}
        />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Không có bài nào khớp "zzz".')).toBeInTheDocument();
  });

  it('giao bài: bắt chọn bộ, chọn và sắp thứ tự chế độ, gửi hạn theo ISO', async () => {
    vi.mocked(listAssignments).mockResolvedValue(list([]));
    vi.mocked(createAssignment).mockResolvedValue(assignment({ mode: 'WRITE' }));
    renderSection();

    await userEvent.click(await screen.findByRole('button', { name: 'Giao bài' }));
    const dialog = await screen.findByRole('dialog', { name: 'Giao bài' });
    const picker = await within(dialog).findByRole('combobox', { name: 'Bộ từ' });

    await userEvent.click(within(dialog).getByRole('button', { name: 'Giao bài' }));
    expect(await within(dialog).findByText('Hãy chọn bộ từ')).toBeInTheDocument();
    expect(createAssignment).not.toHaveBeenCalled();

    // Gõ ngay trong ô chọn để lọc, không có ô tìm kiếm riêng.
    await userEvent.click(picker);
    await userEvent.keyboard('unit');
    await waitFor(() =>
      expect(within(dialog).queryByRole('option', { name: /Nháp/ })).not.toBeInTheDocument(),
    );
    await userEvent.keyboard('{Enter}');
    expect(picker).toHaveValue('Unit 1');
    // Mặc định là lộ trình đề xuất; bỏ Flashcard và Ghép cặp, đưa Luyện viết lên đầu.
    await userEvent.click(within(dialog).getByRole('checkbox', { name: /Flashcard/ }));
    await userEvent.click(within(dialog).getByRole('checkbox', { name: /Ghép cặp/ }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Đưa Luyện viết lên' }));
    const due = within(dialog).getByRole('group', { name: 'Hạn nộp (không bắt buộc)' });
    await userEvent.type(within(due).getByLabelText('Ngày'), '01/12/2026');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Giao bài' }));

    await waitFor(() =>
      expect(createAssignment).toHaveBeenCalledWith('c1', {
        setId: 's1',
        modes: ['WRITE', 'MCQ'],
        dueAt: new Date('2026-12-01T23:59').toISOString(),
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Giao bài' })).not.toBeInTheDocument(),
    );
  });

  it('bộ riêng tư phải đồng ý cho lớp xem, lỗi máy chủ hiện trong hộp thoại', async () => {
    vi.mocked(listAssignments).mockResolvedValue(list([]));
    vi.mocked(createAssignment).mockRejectedValue(new HttpError('Lớp đã lưu trữ', 422, 'X'));
    renderSection();

    await userEvent.click(await screen.findByRole('button', { name: 'Giao bài' }));
    const dialog = await screen.findByRole('dialog', { name: 'Giao bài' });
    await userEvent.click(await within(dialog).findByRole('combobox', { name: 'Bộ từ' }));
    await userEvent.click(within(dialog).getByRole('option', { name: /Nháp/ }));
    expect(within(dialog).getByText(/người ngoài lớp vẫn không thấy/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Giao bài' }));
    expect(
      await within(dialog).findByText('Hãy đồng ý cho học sinh trong lớp xem bộ này'),
    ).toBeInTheDocument();
    expect(createAssignment).not.toHaveBeenCalled();

    await userEvent.click(
      within(dialog).getByRole('checkbox', { name: 'Cho học sinh trong lớp xem bộ này' }),
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Giao bài' }));
    await waitFor(() =>
      expect(createAssignment).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({ shareToClass: true }),
      ),
    );
    expect(await within(dialog).findByText('Lớp đã lưu trữ')).toBeInTheDocument();
  });

  it('huỷ bài giao sau khi xác nhận', async () => {
    vi.mocked(listAssignments).mockResolvedValue(list([assignment()]));
    vi.mocked(removeAssignment).mockResolvedValue();
    renderSection();

    await userEvent.click(await screen.findByRole('button', { name: 'Huỷ bài giao Unit 1' }));
    const dialog = screen.getByRole('dialog', { name: 'Huỷ bài giao Unit 1?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Huỷ bài giao' }));

    await waitFor(() => expect(removeAssignment).toHaveBeenCalledWith('c1', 'a1'));
  });

  it('lớp đã lưu trữ thì không giao thêm bài', async () => {
    vi.mocked(listAssignments).mockResolvedValue(list([]));
    renderSection(true);

    expect(await screen.findByText(/Chưa giao bài nào/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Giao bài' })).not.toBeInTheDocument();
  });

  it('chọn tất cả chế độ hoặc bỏ chọn hết, không giới hạn 5', async () => {
    vi.mocked(listAssignments).mockResolvedValue(list([]));
    renderSection();

    await userEvent.click(await screen.findByRole('button', { name: 'Giao bài' }));
    const dialog = await screen.findByRole('dialog', { name: 'Giao bài' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Chọn tất cả' }));
    const checked = within(dialog)
      .getAllByRole('checkbox')
      .filter((box) => (box as HTMLInputElement).checked);
    expect(checked.length).toBeGreaterThan(5);

    await userEvent.click(within(dialog).getByRole('button', { name: 'Bỏ chọn' }));
    expect(
      within(dialog)
        .getAllByRole('checkbox')
        .filter((box) => (box as HTMLInputElement).checked),
    ).toHaveLength(0);
  });
});
