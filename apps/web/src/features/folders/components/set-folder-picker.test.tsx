import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listFolders, moveSetToFolder } from '../api';
import { SetFolderPicker } from './set-folder-picker';

vi.mock('../api');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function renderPicker(folderId: string | null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <SetFolderPicker setId="s1" folderId={folderId} />
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

  it('gỡ khỏi thư mục bằng mục "Không có thư mục"', async () => {
    renderPicker('f1');
    await userEvent.click(await screen.findByRole('button', { name: /Thư mục: Lớp 6/ }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Không có thư mục' }));

    await waitFor(() => expect(moveSetToFolder).toHaveBeenCalledWith('s1', null));
  });

  it('không hiện khi chưa có thư mục nào', async () => {
    vi.mocked(listFolders).mockResolvedValue({ data: [], meta: { page: 1, limit: 100, total: 0 } });
    renderPicker(null);

    await waitFor(() => expect(listFolders).toHaveBeenCalled());
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
