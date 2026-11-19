import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { createFolder, deleteFolder, listFolders, renameFolder } from '../api';
import { FolderManager } from './folder-manager';

vi.mock('../api');

const folder = { id: 'f1', name: 'Lớp 10', setCount: 2 };

async function renderManager() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <FolderManager />
    </QueryClientProvider>,
  );
  await userEvent.click(screen.getByText('Quản lý thư mục'));
}

describe('FolderManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listFolders).mockResolvedValue({
      data: [folder],
      meta: { page: 1, limit: 100, total: 1 },
    });
  });

  it('tạo thư mục và báo tên trùng từ máy chủ ngay dưới ô nhập', async () => {
    vi.mocked(createFolder)
      .mockRejectedValueOnce(new HttpError('Bạn đã có thư mục tên này', 409, 'FOLDER_NAME_TAKEN'))
      .mockResolvedValueOnce({ id: 'f2', name: 'Ôn thi', setCount: 0 });
    await renderManager();
    const input = screen.getByLabelText('Tên thư mục mới');

    await userEvent.type(input, 'Lớp 10{enter}');
    expect(await screen.findByText('Bạn đã có thư mục tên này')).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, 'Ôn thi{enter}');
    await vi.waitFor(() => expect(createFolder).toHaveBeenLastCalledWith('Ôn thi'));
    await vi.waitFor(() => expect(input).toHaveValue(''));
  });

  it('đổi tên và xoá sau khi xác nhận', async () => {
    vi.mocked(renameFolder).mockResolvedValue({ ...folder, name: 'Lớp 11' });
    vi.mocked(deleteFolder).mockResolvedValue();
    await renderManager();

    await userEvent.click(await screen.findByRole('button', { name: 'Đổi tên Lớp 10' }));
    const renameInput = screen.getByLabelText('Tên mới cho Lớp 10');
    await userEvent.clear(renameInput);
    await userEvent.type(renameInput, 'Lớp 11{enter}');
    await vi.waitFor(() => expect(renameFolder).toHaveBeenCalledWith('f1', 'Lớp 11'));

    await userEvent.click(await screen.findByRole('button', { name: 'Xoá Lớp 10' }));
    const confirm = screen.getByRole('group', { name: 'Xác nhận xoá Lớp 10' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Xoá thư mục' }));

    await vi.waitFor(() => expect(deleteFolder).toHaveBeenCalledWith('f1'));
  });

  it('báo tên rỗng ngay trên trình duyệt', async () => {
    await renderManager();

    await userEvent.click(screen.getByRole('button', { name: 'Tạo thư mục' }));

    expect(await screen.findByText('Hãy nhập tên thư mục')).toBeInTheDocument();
    expect(createFolder).not.toHaveBeenCalled();
  });
});
