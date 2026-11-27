import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from '@/lib/http';
import type { PushStatus } from '../push';
import { NotificationSettings } from './notification-settings';
import { PushPrompt } from './push-prompt';

const push = {
  status: 'off' as PushStatus,
  enable: { mutate: vi.fn(), isPending: false },
  disable: { mutate: vi.fn(), isPending: false },
};
vi.mock('../push', () => ({ usePush: () => push }));
vi.mock('@/lib/http', () => ({ http: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const xp = (totalXp: number) => ({
  data: {
    totalXp,
    level: 1,
    xpIntoLevel: totalXp,
    xpForNextLevel: 100,
    todayXp: 0,
    dailyGoalXp: 20,
  },
});

function renderWith(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

describe('PushPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    push.status = 'off';
  });

  it('không mời khi chưa học phiên nào', async () => {
    vi.mocked(http).mockResolvedValue(xp(0));
    renderWith(<PushPrompt />);
    await vi.waitFor(() => expect(http).toHaveBeenCalled());
    expect(screen.queryByText('Bật nhắc học mỗi tối?')).not.toBeInTheDocument();
  });

  it('mời bật nhắc học sau khi đã có XP, "Để sau" thì ẩn và nhớ lựa chọn', async () => {
    vi.mocked(http).mockResolvedValue(xp(30));
    renderWith(<PushPrompt />);

    await userEvent.click(await screen.findByRole('button', { name: 'Bật nhắc học' }));
    expect(push.enable.mutate).toHaveBeenCalled();

    await userEvent.click(screen.getAllByRole('button', { name: 'Để sau' })[0]!);
    expect(screen.queryByText('Bật nhắc học mỗi tối?')).not.toBeInTheDocument();
    expect(localStorage.getItem('vocab.pushPromptDismissed')).toBe('1');
  });

  it('không mời khi đã bật hoặc đã chặn', async () => {
    vi.mocked(http).mockResolvedValue(xp(30));
    push.status = 'denied';
    renderWith(<PushPrompt />);
    await vi.waitFor(() => expect(http).toHaveBeenCalled());
    expect(screen.queryByText('Bật nhắc học mỗi tối?')).not.toBeInTheDocument();
  });
});

describe('NotificationSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('bật công tắc thì bật thông báo đẩy', async () => {
    push.status = 'off';
    renderWith(<NotificationSettings />);
    await userEvent.click(screen.getByRole('switch', { name: 'Thông báo đẩy trên thiết bị này' }));
    expect(push.enable.mutate).toHaveBeenCalled();
  });

  it('hướng dẫn iPhone thêm vào màn hình chính', () => {
    push.status = 'ios-install';
    renderWith(<NotificationSettings />);
    expect(screen.getByRole('status')).toHaveTextContent(/Thêm vào màn hình chính/);
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });
});
