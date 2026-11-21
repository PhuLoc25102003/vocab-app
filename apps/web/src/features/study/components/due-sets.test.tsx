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
    const summary = screen.getByRole('region', { name: 'Cần ôn hôm nay' });
    expect(summary).toHaveTextContent('3thẻ');
    expect(screen.getByRole('link', { name: 'Ôn bộ đầu tiên' })).toHaveAttribute(
      'href',
      '/sets/s1/study/flashcard?due=1',
    );
    // "Khi nào thẻ đến hạn ôn?" là phần tử bấm được, mở ra giải thích.
    expect(screen.getByText('Khi nào thẻ đến hạn ôn?').closest('summary')).toBeInTheDocument();
  });

  it('chọn nhiều chế độ để ôn nối tiếp, bỏ Flashcard thì bắt đầu bằng chế độ kế', async () => {
    vi.mocked(listDueSets).mockResolvedValue(list(2));
    renderDue();

    await userEvent.click(await screen.findByRole('button', { name: /Trắc nghiệm/ }));
    const link = () => screen.getByRole('link', { name: /^Ôn bộ từ/ });
    expect(link()).toHaveAttribute(
      'href',
      expect.stringContaining('/study/flashcard?due=1&next=mcq'),
    );

    await userEvent.click(screen.getByRole('button', { name: /Flashcard/, pressed: true }));
    expect(link()).toHaveAttribute('href', expect.stringMatching(/\/study\/mcq\?due=1$/));

    await userEvent.click(screen.getByRole('button', { name: 'Chọn tất cả' }));
    expect(screen.getAllByRole('button', { pressed: true }).length).toBeGreaterThanOrEqual(7);
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
    expect(screen.getByText(/giãn ra 6 ngày/i)).toBeInTheDocument();
  });

  it('cho thử lại khi lỗi', async () => {
    vi.mocked(listDueSets).mockRejectedValueOnce(new Error('offline'));
    vi.mocked(listDueSets).mockResolvedValue(list(1));
    renderDue();

    await userEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('1 thẻ đến hạn')).toBeInTheDocument();
  });
});
