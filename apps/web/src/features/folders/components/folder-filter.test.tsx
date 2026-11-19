import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listFolders } from '../api';
import { FolderFilter } from './folder-filter';

vi.mock('../api');

const meta = { page: 1, limit: 100, total: 1 };

function renderFilter(value = '') {
  const onChange = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <FolderFilter value={value} onChange={onChange} />
    </QueryClientProvider>,
  );
  return onChange;
}

describe('FolderFilter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('liệt kê thư mục kèm số bộ và báo lựa chọn mới', async () => {
    vi.mocked(listFolders).mockResolvedValue({
      data: [{ id: 'f1', name: 'Lớp 10', setCount: 3 }],
      meta,
    });
    const onChange = renderFilter();

    await screen.findByRole('option', { name: 'Lớp 10 (3)' });
    await userEvent.selectOptions(screen.getByLabelText('Thư mục'), 'f1');
    await userEvent.selectOptions(screen.getByLabelText('Thư mục'), 'Chưa vào thư mục');

    expect(onChange.mock.calls).toEqual([['f1'], ['none']]);
  });

  it('ẩn khi chưa có thư mục nào hoặc không tải được', async () => {
    vi.mocked(listFolders).mockRejectedValue(new Error('offline'));
    renderFilter();

    await vi.waitFor(() => expect(screen.queryByLabelText('Thư mục')).not.toBeInTheDocument());
  });
});
