import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { MemberResult } from '@vocab/shared';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { getMember, listMemberResults } from '../api';
import { MemberResults } from './member-results';

const navigation = vi.hoisted(() => ({ params: new URLSearchParams(), push: vi.fn() }));
vi.mock('next/navigation', () => ({
  useSearchParams: () => navigation.params,
  useRouter: () => ({ push: navigation.push }),
}));

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api')>()),
  getMember: vi.fn(),
  listMemberResults: vi.fn(),
}));

const row = (overrides: Partial<MemberResult>): MemberResult => ({
  id: 'a1',
  classId: 'c1',
  setId: 's1',
  setTitle: 'Unit 1',
  mode: 'MCQ',
  dueAt: null,
  createdAt: '2026-11-01T00:00:00.000Z',
  status: 'done',
  completedAt: '2026-11-02T03:00:00.000Z',
  correct: 8,
  total: 10,
  ...overrides,
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemberResults classId="c1" userId="u1" />
    </QueryClientProvider>,
  );
}

describe('MemberResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.params = new URLSearchParams();
    vi.mocked(getMember).mockResolvedValue({
      userId: 'u1',
      displayName: 'An',
      joinedAt: '2026-11-10T00:00:00.000Z',
      stats: { onTime: 0, late: 0, missed: 0, pending: 0, averageScore: null, lastActiveAt: null },
    });
    vi.mocked(listMemberResults).mockResolvedValue({
      data: [
        row({}),
        row({
          id: 'a2',
          setTitle: 'Unit 2',
          mode: 'WRITE',
          status: 'overdue',
          completedAt: null,
          correct: null,
          total: null,
        }),
      ],
      meta: { page: 1, limit: 100, total: 2 },
    });
  });

  it('hiện tên, tóm tắt và kết quả từng bài, mỗi bài mở trang kết quả của bài', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'An' })).toBeInTheDocument();
    expect(screen.getByText('Vào lớp 10/11/2026')).toBeInTheDocument();
    expect(screen.getByText('Đã làm 1/2 bài, 1 bài quá hạn chưa làm.')).toBeInTheDocument();

    const items = within(screen.getByRole('list', { name: 'Kết quả các bài' })).getAllByRole(
      'listitem',
    );
    expect(items[0]).toHaveTextContent('8/10 (80%)');
    expect(within(items[0]!).getByRole('link', { name: 'Unit 1' })).toHaveAttribute(
      'href',
      '/classes/c1/assignments/a1',
    );
    expect(items[1]).toHaveTextContent('Quá hạn');
    expect(items[1]).toHaveTextContent('Luyện viết');
    expect(items[1]).toHaveTextContent('Chưa có điểm');
  });

  it('lọc danh sách bài đã giao theo tab trạng thái qua URL', async () => {
    navigation.params = new URLSearchParams('status=overdue');
    renderPage();

    expect(
      await screen.findByRole('link', { name: /Quá hạn/, current: 'page' }),
    ).toBeInTheDocument();
    const items = within(screen.getByRole('list', { name: 'Kết quả các bài' })).getAllByRole(
      'listitem',
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent('Unit 2');
  });

  it('tìm kiếm bài đã giao theo tên bộ từ', async () => {
    renderPage();

    const searchInput = await screen.findByRole('searchbox', { name: 'Tìm bài theo tên bộ từ' });
    await userEvent.type(searchInput, 'Unit 1{enter}');

    expect(navigation.push).toHaveBeenCalledWith('/classes/c1/members/u1?q=Unit+1');
  });

  it('lớp chưa giao bài thì báo trống', async () => {
    vi.mocked(listMemberResults).mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 100, total: 0 },
    });
    renderPage();

    expect(await screen.findByText('Lớp chưa có bài giao')).toBeInTheDocument();
  });

  it('học sinh đã rời lớp thì báo không tìm thấy', async () => {
    vi.mocked(getMember).mockRejectedValue(
      new HttpError('Học sinh không ở trong lớp', 404, 'CLASS_MEMBER_NOT_FOUND'),
    );
    renderPage();

    expect(await screen.findByText('Không tìm thấy học sinh')).toBeInTheDocument();
  });

  it('lỗi mạng thì cho thử lại', async () => {
    vi.mocked(listMemberResults).mockRejectedValue(new HttpError('Lỗi', 500, 'INTERNAL_ERROR'));
    renderPage();

    expect(await screen.findByText('Không tải được kết quả học sinh')).toBeInTheDocument();
  });
});
