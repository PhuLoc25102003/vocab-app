import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from '@/lib/http';
import { StatsOverview } from './stats-overview';

vi.mock('@/lib/http', () => ({ http: vi.fn() }));

const emptyStats = {
  streakDays: 0,
  masteredCards: 0,
  answersToday: 0,
  dueCards: 0,
  hardCards: [],
};

function renderStats() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <StatsOverview />
    </QueryClientProvider>,
  );
}

describe('StatsOverview', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hiện số liệu và từ hay sai', async () => {
    vi.mocked(http).mockResolvedValue({
      data: {
        streakDays: 3,
        masteredCards: 12,
        learningCards: 4,
        activity: [
          { day: '2026-11-14', answers: 0 },
          { day: '2026-11-15', answers: 5 },
          { day: '2026-11-16', answers: 0 },
          { day: '2026-11-17', answers: 2 },
          { day: '2026-11-18', answers: 0 },
          { day: '2026-11-19', answers: 9 },
          { day: '2026-11-20', answers: 7 },
        ],
        answersToday: 7,
        dueCards: 3,
        hardCards: [
          { cardId: 'c1', setId: 's1', term: 'apple', definition: 'quả táo', wrongCount: 4 },
        ],
      },
    });
    renderStats();

    expect(await screen.findByText('Ngày học liên tiếp')).toBeInTheDocument();
    const tiles = screen.getByText('Ngày học liên tiếp').closest('dl') as HTMLElement;
    expect(within(tiles).getByText('12')).toBeInTheDocument();
    expect(within(tiles).getByText('Từ đang học')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Số câu trả lời theo ngày' })).toHaveTextContent(
      '2026-11-199',
    );
    expect(screen.getByText(/^Đã thuộc:/)).toHaveTextContent('Đã thuộc: 12 (75%)');
    expect(screen.getByRole('link', { name: 'apple' })).toHaveAttribute('href', '/sets/s1');
    expect(screen.getByText('Sai 4 lần')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ôn ngay' })).toHaveAttribute('href', '/review');
  });

  it('gợi ý bắt đầu khi chưa học', async () => {
    vi.mocked(http).mockResolvedValue({ data: emptyStats });
    renderStats();

    expect(await screen.findByText('Chưa có số liệu học tập')).toBeInTheDocument();
  });

  it('cho thử lại khi lỗi', async () => {
    vi.mocked(http).mockRejectedValueOnce(new Error('offline'));
    vi.mocked(http).mockResolvedValue({ data: { ...emptyStats, streakDays: 1 } });
    renderStats();

    await userEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Ngày học liên tiếp')).toBeInTheDocument();
  });
});
