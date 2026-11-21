import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { createFolder, deleteFolder, listFolders, renameFolder } from '../api';
import { FolderHeader } from './folder-header';
import { FolderPanel } from './folder-panel';

const navigation = vi.hoisted(() => ({ push: vi.fn(), params: new URLSearchParams() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.params,
}));
vi.mock('../api');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const folders = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `f${index + 1}`,
    name: index === 0 ? 'Lớp 6' : `Thư mục ${index + 1}`,
    setCount: index,
  }));

function renderWithQuery(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  navigation.params = new URLSearchParams();
  vi.mocked(listFolders).mockResolvedValue({
    data: folders(2),
    meta: { page: 1, limit: 100, total: 2 },
  });
});

describe('FolderPanel', () => {
  it('liệt kê Tất cả, Chưa xếp thư mục và từng thư mục kèm số bộ, đánh dấu thư mục đang mở', async () => {
    navigation.params = new URLSearchParams('folder=f1&sort=title');
    renderWithQuery(<FolderPanel />);
    const nav = within(screen.getByRole('navigation', { name: 'Thư mục' }));

    const open = await nav.findByRole('link', { name: /Lớp 6/ });
    expect(open).toHaveAttribute('aria-current', 'page');
    expect(open).toHaveAttribute('href', '/sets?sort=title&folder=f1');
    expect(nav.getByRole('link', { name: 'Tất cả bộ từ' })).toHaveAttribute(
      'href',
      '/sets?sort=title',
    );
    expect(nav.getByRole('link', { name: 'Chưa xếp thư mục' })).toHaveAttribute(
      'href',
      '/sets?sort=title&folder=none',
    );
    expect(nav.queryByLabelText('Lọc thư mục')).not.toBeInTheDocument();
  });

  it('tạo thư mục ngay trên cột rồi mở thư mục mới, báo tên trùng dưới ô nhập', async () => {
    vi.mocked(createFolder)
      .mockRejectedValueOnce(new HttpError('Bạn đã có thư mục tên này', 409, 'FOLDER_NAME_TAKEN'))
      .mockResolvedValueOnce({ id: 'f9', name: 'Ôn thi', setCount: 0 });
    renderWithQuery(<FolderPanel />);

    await userEvent.click(screen.getByRole('button', { name: 'Tạo thư mục mới' }));
    const input = screen.getByLabelText('Tên thư mục mới');
    expect(input).toHaveFocus();
    await userEvent.type(input, 'Lớp 6{enter}');
    expect(await screen.findByText('Bạn đã có thư mục tên này')).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, 'Ôn thi{enter}');
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/sets?folder=f9'));
  });

  it('có ô lọc khi nhiều thư mục', async () => {
    vi.mocked(listFolders).mockResolvedValue({
      data: folders(8),
      meta: { page: 1, limit: 100, total: 8 },
    });
    renderWithQuery(<FolderPanel />);

    await userEvent.type(await screen.findByLabelText('Lọc thư mục'), 'lớp');

    expect(screen.getByRole('link', { name: /Lớp 6/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Thư mục 2/ })).not.toBeInTheDocument();
  });

  it('màn hẹp: nút Thư mục mở tấm đáy có tìm, chọn thư mục và tạo mới', async () => {
    navigation.params = new URLSearchParams('folder=f1&sort=title');
    renderWithQuery(<FolderPanel />);

    const trigger = await screen.findByRole('button', { name: 'Thư mục: Lớp 6' });
    await userEvent.click(trigger);
    const sheet = await screen.findByRole('dialog', { name: 'Chọn thư mục' });
    const list = within(sheet).getByRole('list', { name: 'Danh sách thư mục' });
    expect(within(list).getByRole('link', { name: /Lớp 6/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(list).getByRole('link', { name: 'Chưa xếp thư mục' })).toBeInTheDocument();

    await userEvent.type(within(sheet).getByRole('searchbox', { name: 'Tìm thư mục' }), 'mục 2');
    expect(within(list).queryByRole('link', { name: /Lớp 6/ })).not.toBeInTheDocument();
    expect(within(list).queryByRole('link', { name: 'Tất cả bộ từ' })).not.toBeInTheDocument();
    expect(within(list).getByRole('link', { name: /Thư mục 2/ })).toHaveAttribute(
      'href',
      '/sets?sort=title&folder=f2',
    );

    await userEvent.click(within(sheet).getByRole('button', { name: 'Tạo thư mục' }));
    expect(await screen.findByRole('dialog', { name: 'Tạo thư mục' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Chọn thư mục' })).not.toBeInTheDocument();
  });
});

describe('FolderHeader', () => {
  it('không hiện khi đang xem tất cả', () => {
    renderWithQuery(<FolderHeader />);
    expect(screen.queryByRole('navigation', { name: 'Đường dẫn' })).not.toBeInTheDocument();
  });

  it('hiện đường dẫn, đổi tên và đóng thư mục', async () => {
    vi.mocked(renameFolder).mockResolvedValue({ id: 'f1', name: 'Lớp 6A', setCount: 0 });
    navigation.params = new URLSearchParams('folder=f1');
    renderWithQuery(<FolderHeader />);

    const trail = await screen.findByRole('navigation', { name: 'Đường dẫn' });
    expect(within(trail).getByText('Lớp 6')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Đóng thư mục' })).toHaveAttribute('href', '/sets');

    await userEvent.click(screen.getByRole('button', { name: 'Thao tác với thư mục Lớp 6' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Đổi tên thư mục' }));
    const input = await screen.findByLabelText('Tên thư mục');
    await userEvent.clear(input);
    await userEvent.type(input, 'Lớp 6A{enter}');

    await waitFor(() => expect(renameFolder).toHaveBeenCalledWith('f1', 'Lớp 6A'));
  });

  it('xoá thư mục qua hộp thoại rồi về tất cả bộ từ', async () => {
    vi.mocked(deleteFolder).mockResolvedValue();
    navigation.params = new URLSearchParams('folder=f1');
    renderWithQuery(<FolderHeader />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Thao tác với thư mục Lớp 6' }),
    );
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Xoá thư mục' }));
    const dialog = await screen.findByRole('dialog', { name: 'Xoá thư mục "Lớp 6"?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Xoá thư mục' }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/sets'));
    expect(vi.mocked(deleteFolder).mock.calls[0]?.[0]).toBe('f1');
  });
});
