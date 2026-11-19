import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ERROR_CODES, type SetDetail as SetDetailData } from '@vocab/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { deleteSet, duplicateSet, getSet } from '../api';
import { DuplicateSetButton, SetOwnerActions } from './set-actions';
import { SetDetail } from './set-detail';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
const toasts = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: navigation.push }) }));
vi.mock('sonner', () => ({ toast: toasts }));
vi.mock('../api');

const set: SetDetailData = {
  id: 's1',
  ownerId: 'u1',
  title: 'Trái cây',
  description: 'Từ cơ bản',
  termLang: 'en',
  defLang: 'vi',
  visibility: 'PUBLIC',
  cardCount: 1,
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-18T05:00:00.000Z',
  owner: { displayName: 'An' },
  cards: [
    {
      id: 'c1',
      position: 0,
      term: 'apple',
      definition: 'quả táo',
      phonetic: '/ˈæp.əl/',
      example: 'An apple a day',
      imageUrl: null,
      audioUrl: null,
    },
  ],
};

function renderWithQuery(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const renderDetail = () =>
  renderWithQuery(<SetDetail id="s1" renderActions={() => <button>Hành động</button>} />);

describe('SetDetail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hiện trạng thái đang tải', () => {
    vi.mocked(getSet).mockReturnValue(new Promise(() => undefined));
    renderDetail();

    expect(screen.getByRole('status', { name: 'Đang tải bộ từ' })).toBeInTheDocument();
  });

  it('hiện thông tin bộ từ, thẻ và nút theo quyền', async () => {
    vi.mocked(getSet).mockResolvedValue(set);
    renderDetail();

    expect(await screen.findByRole('heading', { name: 'Trái cây' })).toBeInTheDocument();
    expect(screen.getByText('Tạo bởi An')).toBeInTheDocument();
    expect(screen.getByText('apple')).toHaveAttribute('lang', 'en');
    expect(screen.getByText('quả táo')).toHaveAttribute('lang', 'vi');
    expect(screen.getByText('/ˈæp.əl/')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hành động' })).toBeInTheDocument();
  });

  it('báo bộ từ đang bị ẩn kèm lý do', async () => {
    vi.mocked(getSet).mockResolvedValue({
      ...set,
      hiddenAt: new Date('2026-11-19T00:00:00.000Z'),
      hiddenReason: 'Nội dung xấu',
    });
    renderDetail();

    expect(await screen.findByText(/đang bị quản trị viên ẩn/)).toHaveTextContent(
      'Lý do: Nội dung xấu',
    );
  });

  it('báo bộ từ chưa có thẻ', async () => {
    vi.mocked(getSet).mockResolvedValue({ ...set, cardCount: 0, cards: [] });
    renderDetail();

    expect(await screen.findByText('Bộ từ này chưa có thẻ')).toBeInTheDocument();
  });

  it('báo không tìm thấy khi API trả 404', async () => {
    vi.mocked(getSet).mockRejectedValue(
      new HttpError('Không tìm thấy bộ từ', 404, ERROR_CODES.SET_NOT_FOUND),
    );
    renderDetail();

    expect(await screen.findByText('Không tìm thấy bộ từ')).toBeInTheDocument();
  });

  it('báo lỗi và thử lại được', async () => {
    vi.mocked(getSet).mockRejectedValueOnce(new Error('Mất mạng'));
    vi.mocked(getSet).mockResolvedValue(set);
    renderDetail();

    await userEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByRole('heading', { name: 'Trái cây' })).toBeInTheDocument();
  });
});

describe('SetOwnerActions', () => {
  beforeEach(() => vi.clearAllMocks());

  const startDelete = () => userEvent.click(screen.getByRole('button', { name: 'Xoá bộ từ' }));

  it('chỉ xoá sau khi xác nhận rồi về danh sách', async () => {
    vi.mocked(deleteSet).mockResolvedValue();
    renderWithQuery(<SetOwnerActions id="s1" />);
    await startDelete();
    expect(deleteSet).not.toHaveBeenCalled();

    await startDelete();

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/sets'));
    expect(vi.mocked(deleteSet).mock.calls[0]?.[0]).toBe('s1');
    expect(toasts.success).toHaveBeenCalledWith('Đã xoá bộ từ');
  });

  it('huỷ được khi đang xác nhận', async () => {
    renderWithQuery(<SetOwnerActions id="s1" />);
    await startDelete();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Giữ lại' })).toHaveFocus());
    await userEvent.click(screen.getByRole('button', { name: 'Giữ lại' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Xoá bộ từ' })).toHaveFocus());
    expect(screen.getByRole('link', { name: 'Sửa bộ từ' })).toHaveAttribute(
      'href',
      '/sets/s1/edit',
    );
    expect(deleteSet).not.toHaveBeenCalled();
  });

  it('báo lỗi và ở lại trang khi không xoá được', async () => {
    vi.mocked(deleteSet).mockRejectedValue(new HttpError('Bạn không có quyền', 403, 'FORBIDDEN'));
    renderWithQuery(<SetOwnerActions id="s1" />);
    await startDelete();
    await startDelete();

    await waitFor(() => expect(toasts.error).toHaveBeenCalledWith('Bạn không có quyền'));
    expect(navigation.push).not.toHaveBeenCalled();
  });
});

describe('DuplicateSetButton', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sao chép rồi mở bản sao', async () => {
    vi.mocked(duplicateSet).mockResolvedValue({ ...set, id: 's2' });
    renderWithQuery(<DuplicateSetButton id="s1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Sao chép bộ từ' }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/sets/s2'));
    expect(toasts.success).toHaveBeenCalledWith('Đã sao chép bộ từ');
  });
});
