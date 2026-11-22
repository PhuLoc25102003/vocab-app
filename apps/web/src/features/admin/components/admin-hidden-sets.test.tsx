import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AdminHiddenSetItem } from '@vocab/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { listHiddenSets, unhideSet } from '../api';
import { AdminHiddenSets } from './admin-hidden-sets';

const navigation = vi.hoisted(() => ({ params: new URLSearchParams(), push: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
  useSearchParams: () => navigation.params,
}));

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api')>()),
  listHiddenSets: vi.fn(),
  unhideSet: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockHiddenItem: AdminHiddenSetItem = {
  id: 'set-1',
  title: 'Từ vựng vi phạm chính sách',
  description: 'Mô tả bộ từ',
  cardCount: 20,
  hiddenAt: new Date('2026-11-21T10:00:00.000Z'),
  hiddenReason: 'Nội dung phản cảm',
  owner: {
    id: 'user-1',
    displayName: 'Nguyễn Văn A',
    email: 'user1@example.com',
  },
  hiddenBy: {
    id: 'admin-1',
    displayName: 'Admin User',
  },
  createdAt: new Date('2026-11-20T10:00:00.000Z'),
  updatedAt: new Date('2026-11-21T10:00:00.000Z'),
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AdminHiddenSets />
    </QueryClientProvider>,
  );
}

describe('AdminHiddenSets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.params = new URLSearchParams();
  });

  it('hiển thị danh sách bộ từ bị ẩn và chi tiết lý do, tác giả', async () => {
    vi.mocked(listHiddenSets).mockResolvedValue({
      data: [mockHiddenItem],
      meta: { page: 1, limit: 20, total: 1 },
    });

    renderPage();

    expect(await screen.findByText('Từ vựng vi phạm chính sách')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText(/Nội dung phản cảm/i)).toBeInTheDocument();
    expect(screen.getByText(/20 thẻ/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bỏ ẩn/i })).toBeInTheDocument();
  });

  it('bấm Bỏ ẩn gọi API unhideSet và hiển thị thông báo thành công', async () => {
    const user = userEvent.setup();
    vi.mocked(listHiddenSets).mockResolvedValue({
      data: [mockHiddenItem],
      meta: { page: 1, limit: 20, total: 1 },
    });
    vi.mocked(unhideSet).mockResolvedValue({
      id: 'set-1',
      title: 'Từ vựng vi phạm chính sách',
      hiddenAt: null,
      hiddenReason: null,
      hiddenById: null,
    });

    renderPage();

    const unhideBtn = await screen.findByRole('button', { name: /Bỏ ẩn/i });
    await user.click(unhideBtn);

    await waitFor(() => {
      expect(unhideSet).toHaveBeenCalledWith('set-1');
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Đã bỏ ẩn bộ từ “Từ vựng vi phạm chính sách”'),
      );
    });
  });

  it('hiển thị empty state khi chưa có bộ từ nào bị ẩn', async () => {
    vi.mocked(listHiddenSets).mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0 },
    });

    renderPage();

    expect(await screen.findByText('Chưa có bộ từ nào bị ẩn')).toBeInTheDocument();
  });
});
