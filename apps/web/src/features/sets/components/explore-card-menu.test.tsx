import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PublicSetSummary } from '@vocab/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu';
import { ExploreCardActionsDropdown, ExploreContextMenuContent } from './explore-card-menu';
import * as api from '../api';
import { toast } from 'sonner';

vi.mock('../api');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const dummySet: PublicSetSummary = {
  id: 's1',
  ownerId: 'u1',
  title: 'Trái cây',
  description: null,
  termLang: 'en',
  defLang: 'vi',
  visibility: 'PUBLIC',
  cardCount: 12,
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-18T05:00:00.000Z',
  owner: { displayName: 'Lan' },
};

describe('ExploreCardMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mở menu chuột phải và sao chép liên kết', async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const client = new QueryClient();

    render(
      <QueryClientProvider client={client}>
        <ContextMenu>
          <ContextMenuTrigger>
            <div data-testid="target">Target</div>
          </ContextMenuTrigger>
          <ExploreContextMenuContent set={dummySet} href="/sets/s1" />
        </ContextMenu>
      </QueryClientProvider>,
    );

    await user.pointer([{ target: screen.getByTestId('target'), keys: '[MouseRight]' }]);

    expect(await screen.findByRole('menuitem', { name: /Bắt đầu học/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Sao chép về thư viện/i })).toBeInTheDocument();

    const copyLinkBtn = screen.getByRole('menuitem', { name: /Sao chép liên kết/i });
    await user.click(copyLinkBtn);

    expect(writeTextSpy).toHaveBeenCalledWith(expect.stringContaining('/sets/s1'));
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Đã sao chép liên kết'));
  });

  it('sao chép bộ từ về thư viện khi chọn từ menu 3 chấm', async () => {
    const user = userEvent.setup();
    vi.mocked(api.duplicateSet).mockResolvedValue({
      ...dummySet,
      id: 's2',
      title: 'Trái cây (bản sao)',
    });
    const client = new QueryClient();

    render(
      <QueryClientProvider client={client}>
        <ExploreCardActionsDropdown set={dummySet} href="/sets/s1" />
      </QueryClientProvider>,
    );

    const trigger = screen.getByRole('button', { name: /Thao tác khác/i });
    await user.click(trigger);

    const copyBtn = await screen.findByRole('menuitem', { name: /Sao chép về thư viện/i });
    await user.click(copyBtn);

    await waitFor(() => {
      expect(api.duplicateSet).toHaveBeenCalledWith('s1');
      expect(mockPush).toHaveBeenCalledWith('/sets/s2');
    });
  });

  it('chuyển khách tới trang đăng nhập khi bấm sao chép', async () => {
    const user = userEvent.setup();
    const client = new QueryClient();

    render(
      <QueryClientProvider client={client}>
        <ExploreCardActionsDropdown set={dummySet} href="/public/sets/s1" audience="guest" />
      </QueryClientProvider>,
    );

    const trigger = screen.getByRole('button', { name: /Thao tác khác/i });
    await user.click(trigger);

    const copyBtn = await screen.findByRole('menuitem', { name: /Sao chép về thư viện/i });
    await user.click(copyBtn);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
