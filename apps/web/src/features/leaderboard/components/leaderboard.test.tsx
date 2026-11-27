import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LeaderboardList } from '@/components/common/leaderboard-list';
import { http, HttpError } from '@/lib/http';
import { LeaderboardBoard } from './leaderboard-board';
import { LeaderboardVisibility } from './leaderboard-visibility';

vi.mock('@/lib/http', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/http')>()),
  http: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const entry = (rank: number, displayName: string, xp: number, isMe = false) => ({
  rank,
  displayName,
  xp,
  isMe,
});
const board = {
  week: '2026-11-23',
  entries: [
    entry(1, 'Bảo Ngọc', 120),
    entry(2, 'Minh', 90),
    entry(3, 'An', 60),
    entry(4, 'Hà', 40),
  ],
  me: entry(7, 'Tôi', 10, true),
  hidden: false,
  enabled: true,
};

function renderWith(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

describe('LeaderboardList', () => {
  it('cắt top theo limit và thêm hạng của tôi ở cuối', () => {
    render(<LeaderboardList board={board} limit={3} label="Xếp hạng" />);
    const items = within(screen.getByRole('list', { name: 'Xếp hạng' })).getAllByRole('listitem');
    // 3 dòng top và dòng của tôi; dòng ngăn cách "⋯" ẩn với trình đọc màn hình.
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent('Hạng 1BNBảo Ngọc120 XP');
    expect(items[3]).toHaveAttribute('aria-current', 'true');
    expect(items[3]).toHaveTextContent('Tôi(Bạn)');
  });
});

describe('LeaderboardBoard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('báo trống khi tuần này chưa ai có XP', async () => {
    vi.mocked(http).mockResolvedValue({ data: { ...board, entries: [], me: null } });
    renderWith(<LeaderboardBoard scope="global" week="current" />);
    expect(await screen.findByText('Tuần này chưa ai có XP')).toBeInTheDocument();
  });

  it('báo giáo viên đã tắt bảng của lớp', async () => {
    vi.mocked(http).mockRejectedValue(new HttpError('tắt', 403, 'LEADERBOARD_DISABLED'));
    renderWith(<LeaderboardBoard scope="c1" week="current" />);
    expect(
      await screen.findByText('Giáo viên đã tắt bảng xếp hạng của lớp này.'),
    ).toBeInTheDocument();
    expect(http).toHaveBeenCalledWith('/leaderboard/classes/c1?week=current');
  });

  it('báo đang ẩn tên khỏi bảng chung', async () => {
    vi.mocked(http).mockResolvedValue({ data: { ...board, hidden: true } });
    renderWith(<LeaderboardBoard scope="global" week="previous" />);
    expect(await screen.findByText(/Bạn đang ẩn tên khỏi bảng chung/)).toBeInTheDocument();
    expect(http).toHaveBeenCalledWith('/leaderboard?week=previous');
  });
});

describe('LeaderboardVisibility', () => {
  beforeEach(() => vi.clearAllMocks());

  it('bật công tắc thì gửi ẩn tên', async () => {
    vi.mocked(http).mockImplementation(async (_path, init) =>
      init?.method === 'PUT' ? { data: { hidden: true } } : { data: board },
    );
    renderWith(<LeaderboardVisibility />);

    const toggle = await screen.findByRole('switch', { name: 'Ẩn tôi khỏi bảng xếp hạng chung' });
    await vi.waitFor(() => expect(toggle).toBeEnabled());
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(toggle);
    expect(http).toHaveBeenCalledWith('/leaderboard/visibility', {
      method: 'PUT',
      body: JSON.stringify({ hidden: true }),
    });
  });
});
