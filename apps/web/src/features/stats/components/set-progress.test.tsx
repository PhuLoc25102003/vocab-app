import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from '@/lib/http';
import { SetProgressSummary } from './set-progress';

vi.mock('@/lib/http', () => ({ http: vi.fn() }));

const progress = { total: 5, mastered: 1, learning: 2, notStarted: 2, due: 2 };

function renderProgress() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <SetProgressSummary setId="s1" />
    </QueryClientProvider>,
  );
}

describe('SetProgressSummary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hiện tiến độ và lối ôn thẻ đến hạn', async () => {
    vi.mocked(http).mockResolvedValue({ data: progress });
    renderProgress();

    expect(await screen.findByText('Đã thuộc')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ôn 2 thẻ đến hạn' })).toHaveAttribute(
      'href',
      '/sets/s1/study/flashcard?due=1',
    );
  });

  it('báo khi chưa học thẻ nào', async () => {
    vi.mocked(http).mockResolvedValue({
      data: { total: 5, mastered: 0, learning: 0, notStarted: 5, due: 0 },
    });
    renderProgress();

    expect(await screen.findByText('Bạn chưa học thẻ nào trong bộ từ này.')).toBeInTheDocument();
  });

  it('cho thử lại khi lỗi', async () => {
    vi.mocked(http).mockRejectedValueOnce(new Error('offline'));
    vi.mocked(http).mockResolvedValue({ data: progress });
    renderProgress();

    await userEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Đang học')).toBeInTheDocument();
  });
});
