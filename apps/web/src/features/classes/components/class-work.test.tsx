import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { MyAssignment } from '@vocab/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listMyAssignments } from '../api';
import { ClassWork, dueText } from './class-work';

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api')>()),
  listMyAssignments: vi.fn(),
}));

const item = (overrides: Partial<MyAssignment>): MyAssignment => ({
  id: 'a1',
  classId: 'c1',
  className: 'Fa1',
  setId: 's1',
  setTitle: 'Unit 1',
  mode: 'MCQ',
  modes: ['FLASHCARD', 'MCQ', 'MATCH', 'WRITE'],
  dueAt: null,
  createdAt: '2026-11-01T00:00:00.000Z',
  status: 'pending',
  progressStatus: 'todo',
  doneModes: 0,
  completedAt: null,
  ...overrides,
});
const page = (data: MyAssignment[]) => ({
  data,
  meta: { page: 1, limit: 20, total: data.length },
  counts: { todo: 0, done: 0, all: data.length },
});

function renderWork() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ClassWork />
    </QueryClientProvider>,
  );
}

describe('dueText', () => {
  const now = new Date(2026, 10, 21, 10, 0);
  it('nói quá hạn, hôm nay, ngày mai hoặc ngày giờ', () => {
    expect(dueText(null, now)).toBe('Không có hạn');
    expect(dueText(new Date(2026, 10, 19, 9, 0).toISOString(), now)).toBe('Quá hạn 2 ngày');
    expect(dueText(new Date(2026, 10, 21, 23, 59).toISOString(), now)).toBe('Hạn hôm nay 23:59');
    expect(dueText(new Date(2026, 10, 22, 23, 59).toISOString(), now)).toBe('Hạn mai 23:59');
    expect(dueText(new Date(2026, 10, 30, 8, 0).toISOString(), now)).toBe('Hạn 30/11/2026 08:00');
  });
});

describe('ClassWork', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hiện tối đa 3 bài chưa nộp, bỏ lỡ trước, mỗi bài mở trang bài tập', async () => {
    vi.mocked(listMyAssignments).mockResolvedValue(
      page([
        item({ id: 'm', setTitle: 'Unit 3', progressStatus: 'missed' }),
        item({ id: 'p', setTitle: 'Unit 4', progressStatus: 'in_progress', doneModes: 1 }),
        item({ id: 't1', setTitle: 'Unit 5' }),
        item({ id: 't2', setTitle: 'Unit 6' }),
        item({ id: 's', setTitle: 'Đã nộp', progressStatus: 'submitted' }),
      ]),
    );
    renderWork();

    const section = await screen.findByRole('region', { name: 'Bài tập lớp' });
    const rows = within(section).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('Unit 3');
    expect(within(rows[1] as HTMLElement).getByRole('link', { name: /Tiếp tục/ })).toHaveAttribute(
      'href',
      '/classes/assignments/p',
    );
    expect(rows[1]).toHaveTextContent('1/4 chế độ');
    expect(section).not.toHaveTextContent('Đã nộp');
  });

  it('không còn bài cần làm hoặc chưa vào lớp thì ẩn hẳn', async () => {
    vi.mocked(listMyAssignments).mockResolvedValue(page([item({ progressStatus: 'submitted' })]));
    const { container } = renderWork();

    await waitFor(() => expect(listMyAssignments).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
