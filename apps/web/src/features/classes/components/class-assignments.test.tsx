import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Assignment, SetSummary } from '@vocab/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import {
  createAssignment,
  listAssignments,
  listMySetsForAssigning,
  removeAssignment,
} from '../api';
import { ClassAssignments } from './class-assignments';

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api')>()),
  createAssignment: vi.fn(),
  listAssignments: vi.fn(),
  listMySetsForAssigning: vi.fn(),
  removeAssignment: vi.fn(),
}));

const assignment = (overrides: Partial<Assignment> = {}): Assignment => ({
  id: 'a1',
  classId: 'c1',
  setId: 's1',
  setTitle: 'Unit 1',
  mode: 'MCQ',
  dueAt: null,
  createdAt: '2026-11-01T00:00:00.000Z',
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
const list = (data: Assignment[]) => ({ data, meta: { page: 1, limit: 100, total: data.length } });

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

  it('liệt kê bài đã giao với chế độ, hạn nộp và báo quá hạn', async () => {
    vi.mocked(listAssignments).mockResolvedValue(
      list([
        assignment({ dueAt: '2020-01-01T16:59:00.000Z' }),
        assignment({ id: 'a2', setTitle: 'Unit 2', mode: 'WRITE' }),
      ]),
    );
    renderSection();

    const rows = within(await screen.findByRole('list', { name: 'Bài đã giao' })).getAllByRole(
      'listitem',
    );
    expect(rows[0]).toHaveTextContent('Trắc nghiệm');
    expect(rows[0]).toHaveTextContent('Đã quá hạn');
    expect(rows[1]).toHaveTextContent('Luyện viết');
    expect(rows[1]).toHaveTextContent('Không có hạn');
  });

  it('giao bài: bắt chọn bộ, chọn và sắp thứ tự chế độ, gửi hạn theo ISO', async () => {
    vi.mocked(listAssignments).mockResolvedValue(list([]));
    vi.mocked(createAssignment).mockResolvedValue(assignment({ mode: 'WRITE' }));
    renderSection();

    await userEvent.click(await screen.findByRole('button', { name: 'Giao bài' }));
    const dialog = await screen.findByRole('dialog', { name: 'Giao bài' });
    await within(dialog).findByRole('option', { name: /Nháp/ });

    await userEvent.click(within(dialog).getByRole('button', { name: 'Giao bài' }));
    expect(await within(dialog).findByText('Hãy chọn bộ từ')).toBeInTheDocument();
    expect(createAssignment).not.toHaveBeenCalled();

    await userEvent.selectOptions(within(dialog).getByLabelText('Bộ từ'), 's1');
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
    await userEvent.selectOptions(await within(dialog).findByLabelText('Bộ từ'), 's2');
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
});
