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
  summary: { dueCards },
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

  it('báo khi chưa có thẻ cần ôn', async () => {
    vi.mocked(listDueSets).mockResolvedValue(list(0));
    renderDue();

    expect(await screen.findByText('Hôm nay chưa có từ cần ôn')).toBeInTheDocument();
  });

  it('cho thử lại khi lỗi', async () => {
    vi.mocked(listDueSets).mockRejectedValueOnce(new Error('offline'));
    vi.mocked(listDueSets).mockResolvedValue(list(1));
    renderDue();

    await userEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('1 thẻ đến hạn')).toBeInTheDocument();
  });
});
