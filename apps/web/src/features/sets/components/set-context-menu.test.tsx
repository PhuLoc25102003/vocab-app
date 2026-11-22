import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { SetSummary } from '@vocab/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu';
import { SetCardActionsDropdown, SetContextMenuContent } from './set-context-menu';
import * as api from '../api';
import * as offlineStore from '@/lib/offline-store';
import { toast } from 'sonner';

vi.mock('../api');
vi.mock('@/lib/offline-store');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => 'toast-id'),
  },
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const dummySet: SetSummary = {
  id: 's1',
  ownerId: 'u1',
  title: 'Từ vựng tiếng Anh',
  description: 'Mô tả bài học',
  termLang: 'en',
  defLang: 'vi',
  visibility: 'PRIVATE',
  cardCount: 15,
  createdAt: '2026-11-20T00:00:00.000Z',
  updatedAt: '2026-11-20T00:00:00.000Z',
};

function renderContextMenu(
  ui: React.ReactNode,
  folders = [{ id: 'f1', name: 'Lớp 8' }],
  onMoveToFolder = vi.fn(),
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ContextMenu>
        <ContextMenuTrigger>
          <div data-testid="target-card">Card Target</div>
        </ContextMenuTrigger>
        <SetContextMenuContent set={dummySet} folders={folders} onMoveToFolder={onMoveToFolder} />
      </ContextMenu>
    </QueryClientProvider>,
  );
}

describe('SetContextMenuContent & SetCardActionsDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(offlineStore.getOfflineSet).mockResolvedValue(null);
  });

  it('mở menu khi chuột phải và hiện đầy đủ các chức năng', async () => {
    const user = userEvent.setup();
    renderContextMenu(<div />);

    const target = screen.getByTestId('target-card');
    await user.pointer([{ target, keys: '[MouseRight]' }]);

    expect(await screen.findByRole('menuitem', { name: /Bắt đầu học/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Sửa bộ từ/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Chuyển vào thư mục/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Nhập thêm thẻ/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Tải về máy/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Sao chép liên kết/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Tạo bản sao/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Xoá bộ từ/i })).toBeInTheDocument();
  });

  it('mở menu từ nút ba chấm (tối ưu cho mobile)', async () => {
    const user = userEvent.setup();
    const client = new QueryClient();

    render(
      <QueryClientProvider client={client}>
        <SetCardActionsDropdown set={dummySet} />
      </QueryClientProvider>,
    );

    const trigger = screen.getByRole('button', { name: /Thao tác khác/i });
    await user.click(trigger);

    expect(await screen.findByRole('menuitem', { name: /Bắt đầu học/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Sửa bộ từ/i })).toBeInTheDocument();
  });

  it('sao chép liên kết bộ từ vào clipboard', async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();

    renderContextMenu(<div />);
    const target = screen.getByTestId('target-card');
    await user.pointer([{ target, keys: '[MouseRight]' }]);

    const copyBtn = await screen.findByRole('menuitem', { name: /Sao chép liên kết/i });
    await user.click(copyBtn);

    expect(writeTextSpy).toHaveBeenCalledWith(expect.stringContaining('/sets/s1'));
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Đã sao chép liên kết'));
  });

  it('nhân bản bộ từ khi chọn Tạo bản sao', async () => {
    const user = userEvent.setup();
    vi.mocked(api.duplicateSet).mockResolvedValue({
      ...dummySet,
      id: 's2',
      title: 'Từ vựng tiếng Anh (bản sao)',
    });

    renderContextMenu(<div />);
    const target = screen.getByTestId('target-card');
    await user.pointer([{ target, keys: '[MouseRight]' }]);

    const dupBtn = await screen.findByRole('menuitem', { name: /Tạo bản sao/i });
    await user.click(dupBtn);

    await waitFor(() => {
      expect(api.duplicateSet).toHaveBeenCalledWith('s1');
      expect(mockPush).toHaveBeenCalledWith('/sets/s2');
    });
  });

  it('tải về máy khi chọn Lưu ngoại tuyến', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getSet).mockResolvedValue({
      ...dummySet,
      cards: [],
      owner: { displayName: 'Lộc' },
    });
    vi.mocked(offlineStore.saveOfflineSet).mockResolvedValue(undefined as never);

    renderContextMenu(<div />);
    const target = screen.getByTestId('target-card');
    await user.pointer([{ target, keys: '[MouseRight]' }]);

    const dlBtn = await screen.findByRole('menuitem', { name: /Tải về máy/i });
    await user.click(dlBtn);

    await waitFor(() => {
      expect(api.getSet).toHaveBeenCalledWith('s1');
      expect(offlineStore.saveOfflineSet).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Đã tải về máy'),
        expect.anything(),
      );
    });
  });
});
