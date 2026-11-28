import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from '@/lib/http';
import { XP_RULES } from '@vocab/shared';
import { AccountLevel } from './account-level';
import { BadgeList } from './badge-list';
import { DailyGoalSettings } from './daily-goal-settings';
import { XpGuide } from './xp-guide';
import { XpProgress } from './xp-progress';

vi.mock('@/lib/http', () => ({ http: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const summary = {
  totalXp: 260,
  level: 3,
  xpIntoLevel: 10,
  xpForNextLevel: 200,
  todayXp: 12,
  dailyGoalXp: 100,
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
    expect(screen.getByRole('progressbar', { name: '12 trên 100 XP hôm nay' })).toHaveAttribute(
      'aria-valuenow',
      '12',
    );
    expect(screen.getByText('Còn 88 XP nữa là đạt mục tiêu hôm nay')).toBeInTheDocument();
    expect(screen.getByText('Còn 190 XP để lên cấp 4')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mục tiêu và cách tính XP' })).toHaveAttribute(
      'href',
      '/account#daily-goal-title',
    );
  });

  it('báo hoàn thành khi đạt mục tiêu', async () => {
    vi.mocked(http).mockResolvedValue({ data: { ...summary, todayXp: 120 } });
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
      init?.method === 'PUT' ? { data: { ...summary, dailyGoalXp: 200 } } : { data: summary },
    );
    renderWith(<DailyGoalSettings />);

    expect(await screen.findByRole('radio', { name: /^100 XP/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio', { name: /^100 XP/ })).toHaveTextContent('khoảng 10 câu đúng');
    await userEvent.click(screen.getByRole('radio', { name: /^200 XP/ }));

    expect(http).toHaveBeenCalledWith('/stats/xp/goal', {
      method: 'PUT',
      body: JSON.stringify({ dailyGoalXp: 200 }),
    });
    expect(await screen.findByRole('radio', { name: /^200 XP/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});

describe('XpGuide', () => {
  it('giải thích luật XP bằng đúng các con số của server', async () => {
    renderWith(<XpGuide />);
    await userEvent.click(screen.getByText('Cách tính XP'));
    expect(screen.getByText(/các chế độ có chấm.*\+10 XP\./)).toBeVisible();
    expect(XP_RULES.correct).toBe(10);
    expect(screen.getByText(/Xem thẻ là bạn tự đánh giá.*\+2 XP.*dưới 1,5 giây/)).toBeVisible();
    expect(screen.getByText(/Tối đa 500 XP mỗi ngày/)).toBeVisible();
    expect(screen.getByText(/= 65 XP\./)).toBeVisible();
    expect(screen.getByText(/cấp 2 lên 3 cần 150 XP/)).toBeVisible();
  });
});

describe('AccountLevel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hiện cấp, tổng XP và phần còn thiếu để lên cấp', async () => {
    vi.mocked(http).mockResolvedValue({ data: summary });
    renderWith(<AccountLevel />);
    expect(await screen.findByText('Cấp 3')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Tiến độ lên cấp 4' })).toBeInTheDocument();
  });
});

describe('BadgeList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hiện huy hiệu đã có và tiến độ huy hiệu chưa có', async () => {
    vi.mocked(http).mockResolvedValue({
      data: [
        { code: 'streak-7', progress: 7, target: 7, earnedAt: '2026-11-20T03:00:00.000Z' },
        { code: 'mastered-100', progress: 45, target: 100, earnedAt: null },
      ],
    });
    renderWith(<BadgeList />);

    expect(await screen.findByText('Đã có 1 trên 2')).toBeInTheDocument();
    expect(screen.getByText('Một tuần bền bỉ')).toBeInTheDocument();
    expect(screen.getByText(/^Nhận ngày/)).toBeInTheDocument();
    expect(screen.getByText('45/100')).toBeInTheDocument();
  });
});
