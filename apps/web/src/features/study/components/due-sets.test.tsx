import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listDueSets } from '../api';
import { DueSets } from './due-sets';

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock('../api');

const list = (dueCards: number) => ({
  data: dueCards ? [{ setId: 's1', title: 'Trái cây', dueCount: dueCards }] : [],
  meta: { page: 1, limit: 20, total: dueCards ? 1 : 0 },
  summary: { dueCards, nextDueAt: null },
});

function renderDue() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <DueSets />
    </QueryClientProvider>,
  );
}

describe('DueSets', () => {
  beforeEach(() => vi.clearAllMocks());

  it('liệt kê bộ từ và mở phiên ôn thẻ đến hạn', async () => {
    vi.mocked(listDueSets).mockResolvedValue(list(3));
    renderDue();

    expect(await screen.findByRole('link', { name: 'Ôn bộ từ Trái cây' })).toHaveAttribute(
      'href',
      '/sets/s1/study/flashcard?due=1',
    );
    expect(screen.getByText('3 thẻ đến hạn')).toBeInTheDocument();
  });

  it('mở phiên ôn bằng chế độ đã chọn', async () => {
    vi.mocked(listDueSets).mockResolvedValue(list(2));
    renderDue();

    await userEvent.selectOptions(await screen.findByLabelText('Ôn bằng chế độ'), 'mcq');

    expect(screen.getByRole('link', { name: /^Ôn bộ từ/ })).toHaveAttribute(
      'href',
      expect.stringContaining('/study/mcq?due=1'),
    );
  });

  it('báo khi chưa có thẻ cần ôn', async () => {
    vi.mocked(listDueSets).mockResolvedValue(list(0));
    renderDue();

    expect(await screen.findByText('Hôm nay chưa có từ cần ôn')).toBeInTheDocument();
  });

  it('báo thẻ tiếp theo đến hạn và giải thích lịch ôn', async () => {
    vi.mocked(listDueSets).mockResolvedValue({
      ...list(0),
      summary: { dueCards: 0, nextDueAt: new Date('2026-11-21T02:30:00Z') },
    });
    renderDue();

    expect(await screen.findByText(/^Thẻ tiếp theo đến hạn lúc/)).toBeInTheDocument();
    expect(screen.getByText('Khi nào thẻ đến hạn ôn?')).toBeInTheDocument();
    expect(screen.getByText(/giãn ra 6 ngày/)).toBeInTheDocument();
  });

  it('cho thử lại khi lỗi', async () => {
    vi.mocked(listDueSets).mockRejectedValueOnce(new Error('offline'));
    vi.mocked(listDueSets).mockResolvedValue(list(1));
    renderDue();

    await userEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('1 thẻ đến hạn')).toBeInTheDocument();
  });
});
