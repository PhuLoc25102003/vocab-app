import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ERROR_CODES, type SetDetail, type SetSummary } from '@vocab/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Activity, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { createSet, getSet, replaceCards, updateSet } from '../api';
import { CreateSet } from './create-set';
import { EditSet } from './edit-set';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: navigation.push }) }));
vi.mock('../api');

const summary: SetSummary = {
  id: 's1',
  ownerId: 'u1',
  title: 'Trái cây',
  description: 'Từ cơ bản',
  termLang: 'en',
  defLang: 'vi',
  visibility: 'CLASS',
  cardCount: 0,
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-18T05:00:00.000Z',
};
const detail: SetDetail = { ...summary, owner: { displayName: 'An' }, cards: [] };

function renderWithQuery(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const save = () => userEvent.click(screen.getByRole('button', { name: 'Lưu bộ từ' }));

describe('CreateSet', () => {
  beforeEach(() => vi.clearAllMocks());

  it('báo lỗi dưới ô tên và không gửi khi thiếu tên', async () => {
    renderWithQuery(<CreateSet />);
    await save();

    expect(await screen.findByText('Hãy nhập tên bộ từ')).toBeInTheDocument();
    expect(screen.getByLabelText('Tên bộ từ')).toHaveAttribute('aria-invalid', 'true');
    expect(createSet).not.toHaveBeenCalled();
  });

  it('tạo bộ từ, bỏ mô tả trống rồi về danh sách', async () => {
    vi.mocked(createSet).mockResolvedValue(summary);
    renderWithQuery(<CreateSet />);
    await userEvent.type(screen.getByLabelText('Tên bộ từ'), '  Trái cây ');
    await userEvent.selectOptions(screen.getByLabelText('Ai xem được'), 'PUBLIC');
    await save();

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/sets/s1'));
    expect(vi.mocked(createSet).mock.calls[0]?.[0]).toEqual({
      title: 'Trái cây',
      description: undefined,
      termLang: 'en',
      defLang: 'vi',
      visibility: 'PUBLIC',
      cards: [],
    });
  });

  it('trở về form trống khi quay lại trang đã ẩn', async () => {
    const client = new QueryClient();
    const page = (mode: 'visible' | 'hidden') => (
      <QueryClientProvider client={client}>
        <Activity mode={mode}>
          <CreateSet />
        </Activity>
      </QueryClientProvider>
    );
    const { rerender } = render(page('visible'));
    await userEvent.type(screen.getByLabelText('Tên bộ từ'), 'Trái cây');

    rerender(page('hidden'));
    rerender(page('visible'));

    await waitFor(() => expect(screen.getByLabelText('Tên bộ từ')).toHaveValue(''));
  });

  it('gắn lỗi của API vào đúng ô và giữ nguyên trang', async () => {
    vi.mocked(createSet).mockRejectedValue(
      new HttpError('Dữ liệu không hợp lệ', 400, ERROR_CODES.VALIDATION_ERROR, [
        { path: 'title', message: 'Tên đã bị từ chối' },
      ]),
    );
    renderWithQuery(<CreateSet />);
    await userEvent.type(screen.getByLabelText('Tên bộ từ'), 'Trái cây');
    await save();

    expect(await screen.findByText('Tên đã bị từ chối')).toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
  });
});

describe('EditSet', () => {
  beforeEach(() => vi.clearAllMocks());

  it('báo lỗi chung ở đầu form khi không lưu được', async () => {
    vi.mocked(getSet).mockResolvedValue(detail);
    vi.mocked(updateSet).mockRejectedValue(
      new HttpError('Bạn không có quyền', 403, ERROR_CODES.FORBIDDEN),
    );
    renderWithQuery(<EditSet id="s1" />);
    await screen.findByLabelText('Tên bộ từ');
    await save();

    expect(await screen.findByRole('alert')).toHaveTextContent('Bạn không có quyền');
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('hiện trạng thái đang tải', () => {
    vi.mocked(getSet).mockReturnValue(new Promise(() => undefined));
    renderWithQuery(<EditSet id="s1" />);

    expect(screen.getByRole('status', { name: 'Đang tải bộ từ' })).toBeInTheDocument();
  });

  it('điền dữ liệu cũ, giữ chế độ lớp học và gửi null khi xoá mô tả', async () => {
    vi.mocked(getSet).mockResolvedValue(detail);
    vi.mocked(updateSet).mockResolvedValue(summary);
    vi.mocked(replaceCards).mockResolvedValue();
    renderWithQuery(<EditSet id="s1" />);

    const description = await screen.findByLabelText('Mô tả (không bắt buộc)');
    expect(screen.getByLabelText('Ai xem được')).toHaveValue('CLASS');
    await userEvent.clear(description);
    await save();

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/sets/s1'));
    expect(updateSet).toHaveBeenCalledWith('s1', {
      title: 'Trái cây',
      description: null,
      termLang: 'en',
      defLang: 'vi',
      visibility: 'CLASS',
    });
    expect(replaceCards).toHaveBeenCalledWith('s1', { cards: [] });
  });

  it('báo không tìm thấy khi API trả 404', async () => {
    vi.mocked(getSet).mockRejectedValue(
      new HttpError('Không tìm thấy bộ từ', 404, ERROR_CODES.SET_NOT_FOUND),
    );
    renderWithQuery(<EditSet id="s1" />);

    expect(await screen.findByText('Không tìm thấy bộ từ')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument();
  });

  it('báo lỗi và thử lại được', async () => {
    vi.mocked(getSet).mockRejectedValueOnce(new Error('Mất mạng'));
    vi.mocked(getSet).mockResolvedValue(detail);
    renderWithQuery(<EditSet id="s1" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByLabelText('Tên bộ từ')).toHaveValue('Trái cây');
  });
});
