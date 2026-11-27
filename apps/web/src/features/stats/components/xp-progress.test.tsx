import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from '@/lib/http';
import { DailyGoalSettings } from './daily-goal-settings';
import { XpProgress } from './xp-progress';

vi.mock('@/lib/http', () => ({ http: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const summary = {
  totalXp: 260,
  level: 3,
  xpIntoLevel: 10,
  xpForNextLevel: 200,
  todayXp: 12,
  dailyGoalXp: 20,
};

function renderWith(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

describe('XpProgress', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hiện cấp, vòng mục tiêu ngày và XP còn thiếu', async () => {
    vi.mocked(http).mockResolvedValue({ data: summary });
    renderWith(<XpProgress />);

    expect(await screen.findByRole('heading', { name: 'Cấp 3' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: '12 trên 20 XP hôm nay' })).toHaveAttribute(
      'aria-valuenow',
      '12',
    );
    expect(screen.getByText('Còn 8 XP nữa là đạt mục tiêu hôm nay')).toBeInTheDocument();
    expect(screen.getByText('Còn 190 XP để lên cấp 4')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Đổi mục tiêu' })).toHaveAttribute(
      'href',
      '/account#daily-goal-title',
    );
  });

  it('báo hoàn thành khi đạt mục tiêu', async () => {
    vi.mocked(http).mockResolvedValue({ data: { ...summary, todayXp: 30 } });
    renderWith(<XpProgress />);
    expect(await screen.findByText('Hoàn thành hôm nay 🎉')).toBeInTheDocument();
  });

  it('mời nhận XP đầu tiên khi chưa có XP', async () => {
    vi.mocked(http).mockResolvedValue({
      data: { ...summary, totalXp: 0, level: 1, xpIntoLevel: 0, xpForNextLevel: 100, todayXp: 0 },
    });
    renderWith(<XpProgress />);
    expect(await screen.findByText('Trả lời đúng để nhận XP đầu tiên')).toBeInTheDocument();
  });

  it('hiện lỗi và tải lại được', async () => {
    vi.mocked(http).mockRejectedValueOnce(new Error('offline'));
    vi.mocked(http).mockResolvedValue({ data: summary });
    renderWith(<XpProgress />);

    await userEvent.click(await screen.findByRole('button', { name: /thử lại/i }));
    expect(await screen.findByRole('heading', { name: 'Cấp 3' })).toBeInTheDocument();
  });
});

describe('DailyGoalSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('đổi mục tiêu bằng nhóm lựa chọn', async () => {
    vi.mocked(http).mockImplementation(async (path, init) =>
      init?.method === 'PUT' ? { data: { ...summary, dailyGoalXp: 50 } } : { data: summary },
    );
    renderWith(<DailyGoalSettings />);

    expect(await screen.findByRole('radio', { name: /20 XP/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await userEvent.click(screen.getByRole('radio', { name: /50 XP/ }));

    expect(http).toHaveBeenCalledWith('/stats/xp/goal', {
      method: 'PUT',
      body: JSON.stringify({ dailyGoalXp: 50 }),
    });
    expect(await screen.findByRole('radio', { name: /50 XP/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
