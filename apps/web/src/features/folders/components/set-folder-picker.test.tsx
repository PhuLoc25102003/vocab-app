import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listFolders, moveSetToFolder } from '../api';
import { SetFolderPicker } from './set-folder-picker';

vi.mock('../api');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function renderPicker(folderId: string | null, variant: 'chip' | 'icon' = 'chip') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SetFolderPicker setId="s1" folderId={folderId} variant={variant} setTitle="Hương 1" />
    </QueryClientProvider>,
  );
}

describe('SetFolderPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(moveSetToFolder).mockResolvedValue();
    vi.mocked(listFolders).mockResolvedValue({
      data: [
        { id: 'f1', name: 'Lớp 6', setCount: 1 },
        { id: 'f2', name: 'Ôn thi', setCount: 0 },
      ],
      meta: { page: 1, limit: 100, total: 2 },
    });
  });

  it('hiện thư mục hiện tại, chọn thư mục khác thì chuyển bộ từ', async () => {
    renderPicker('f1');
    await userEvent.click(
      await screen.findByRole('button', { name: 'Thư mục: Lớp 6. Đổi thư mục' }),
    );

    expect(screen.getByRole('menuitemradio', { name: 'Lớp 6' })).toBeChecked();
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Ôn thi' }));

    await waitFor(() => expect(moveSetToFolder).toHaveBeenCalledWith('s1', 'f2'));
  });

  it('vẫn báo đã gỡ khi bộ từ rời danh sách trước lúc request xong (#312)', async () => {
    let finish = () => {};
    vi.mocked(moveSetToFolder).mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    const { unmount } = renderPicker('f1', 'icon');
    await userEvent.click(await screen.findByRole('button', { name: /Chuyển "Hương 1"/ }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Gỡ khỏi thư mục Lớp 6' }));
    await waitFor(() => expect(moveSetToFolder).toHaveBeenCalled());

    // Trang thư mục tải lại danh sách, thẻ bộ từ cùng nút này biến mất.
    unmount();
    finish();

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Đã gỡ khỏi thư mục'));
  });

  it('gỡ khỏi thư mục bằng mục "Không có thư mục"', async () => {
    renderPicker('f1');
    await userEvent.click(await screen.findByRole('button', { name: /Thư mục: Lớp 6/ }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Không có thư mục' }));

    await waitFor(() => expect(moveSetToFolder).toHaveBeenCalledWith('s1', null));
  });

  it('nút trên thẻ bộ từ có nhãn rõ ràng và mục gỡ khỏi thư mục', async () => {
    renderPicker('f1', 'icon');
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Chuyển "Hương 1" vào thư mục, đang ở: Lớp 6',
      }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Gỡ khỏi thư mục Lớp 6' }));

    await waitFor(() => expect(moveSetToFolder).toHaveBeenCalledWith('s1', null));
  });

  it('không hiện khi chưa có thư mục nào', async () => {
    vi.mocked(listFolders).mockResolvedValue({ data: [], meta: { page: 1, limit: 100, total: 0 } });
    renderPicker(null);

    await waitFor(() => expect(listFolders).toHaveBeenCalled());
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
