import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from '@/lib/http';
import { SessionXp } from './session-xp';

vi.mock('@/lib/http', () => ({ http: vi.fn() }));

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

describe('SessionXp', () => {
  beforeEach(() => vi.clearAllMocks());

  it('không hiện và không gọi API khi phiên không có XP', () => {
    renderWith(<SessionXp xpEarned={0} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(http).not.toHaveBeenCalled();
  });

  it('báo lên cấp khi XP của phiên vượt XP trong cấp', async () => {
    vi.mocked(http).mockResolvedValue({ data: summary });
    renderWith(<SessionXp xpEarned={40} />);
    expect(screen.getByText('+40 XP')).toBeInTheDocument();
    expect(await screen.findByText('Lên cấp 3!')).toBeInTheDocument();
  });

  it('hiện huy hiệu mới, bỏ qua mã không biết', () => {
    renderWith(<SessionXp xpEarned={0} newBadges={['streak-7', 'unknown']} />);
    expect(screen.getByText('Huy hiệu mới: Một tuần bền bỉ')).toBeInTheDocument();
    expect(screen.queryByText(/unknown/)).not.toBeInTheDocument();
  });
});
