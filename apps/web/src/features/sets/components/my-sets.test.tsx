import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { SetList, SetSummary } from '@vocab/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listMySets } from '../api';
import { MySets, SETS_PAGE_SIZE } from './my-sets';
import { RecentSets } from './recent-sets';

const navigation = vi.hoisted(() => ({ params: new URLSearchParams(), push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.params,
}));
vi.mock('../api');

const set: SetSummary = {
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
};

const list = (data: SetSummary[], total: number, page = 1, limit = SETS_PAGE_SIZE): SetList => ({
  data,
  meta: { page, limit, total },
});

function renderWithQuery(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('MySets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.params = new URLSearchParams();
  });

  it('hiện trạng thái đang tải', () => {
    vi.mocked(listMySets).mockReturnValue(new Promise(() => undefined));
    renderWithQuery(<MySets />);

    expect(screen.getByRole('status', { name: 'Đang tải bộ từ' })).toBeInTheDocument();
  });

  it('hiện bộ từ với số thẻ, chế độ và ngày cập nhật', async () => {
    vi.mocked(listMySets).mockResolvedValue(list([set], 1));
    renderWithQuery(<MySets />);

    expect(await screen.findByText('Trái cây')).toBeInTheDocument();
    expect(screen.getByText('12 thẻ')).toBeInTheDocument();
    expect(screen.getByText('Công khai')).toBeInTheDocument();
    expect(screen.getByText('18/11/2026')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(listMySets).toHaveBeenCalledWith({ page: 1, limit: SETS_PAGE_SIZE });
  });

  it('tìm theo tên và giữ cách sắp xếp trên địa chỉ', async () => {
    navigation.params = new URLSearchParams('sort=title');
    vi.mocked(listMySets).mockResolvedValue(list([set], 1));
    renderWithQuery(<MySets />);

    await userEvent.type(await screen.findByRole('searchbox'), 'táo{Enter}');

    expect(listMySets).toHaveBeenCalledWith({ page: 1, limit: SETS_PAGE_SIZE, sort: 'title' });
    expect(navigation.push).toHaveBeenCalledWith('/sets?q=t%C3%A1o&sort=title');
  });

  it('lọc theo phạm vi hiển thị và đẩy tham số vào URL', async () => {
    navigation.params = new URLSearchParams('visibility=PUBLIC');
    vi.mocked(listMySets).mockResolvedValue(list([set], 1));
    renderWithQuery(<MySets />);

    expect(listMySets).toHaveBeenCalledWith({
      page: 1,
      limit: SETS_PAGE_SIZE,
      visibility: 'PUBLIC',
    });
    const filter = await screen.findByRole('combobox', { name: 'Lọc phạm vi' });
    await userEvent.selectOptions(filter, 'PRIVATE');
    expect(navigation.push).toHaveBeenCalledWith('/sets?visibility=PRIVATE');
  });

  it('đổi cách sắp xếp và về trang đầu', async () => {
    navigation.params = new URLSearchParams('page=3');
    vi.mocked(listMySets).mockResolvedValue(list([set], 80, 3));
    renderWithQuery(<MySets />);

    await userEvent.selectOptions(await screen.findByLabelText('Sắp xếp'), 'title');

    expect(navigation.push).toHaveBeenCalledWith('/sets?sort=title');
  });

  it('báo không có kết quả và cho xem tất cả', async () => {
    navigation.params = new URLSearchParams('q=xyz');
    vi.mocked(listMySets).mockResolvedValue(list([], 0));
    renderWithQuery(<MySets />);

    expect(await screen.findByText('Không tìm thấy bộ từ phù hợp')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Xem tất cả' })).toHaveAttribute('href', '/sets');
    expect(listMySets).toHaveBeenCalledWith({ page: 1, limit: SETS_PAGE_SIZE, q: 'xyz' });
  });

  it('lọc theo thư mục trên địa chỉ, giữ thư mục khi đổi sắp xếp', async () => {
    navigation.params = new URLSearchParams('folder=f1');
    vi.mocked(listMySets).mockResolvedValue(list([], 0));
    renderWithQuery(<MySets />);

    expect(await screen.findByText('Thư mục này chưa có bộ từ')).toBeInTheDocument();
    expect(listMySets).toHaveBeenCalledWith({ page: 1, limit: SETS_PAGE_SIZE, folderId: 'f1' });
    await userEvent.selectOptions(screen.getByLabelText('Sắp xếp'), 'title');

    expect(navigation.push.mock.calls).toEqual([['/sets?sort=title&folder=f1']]);
    expect(screen.getByRole('link', { name: 'Xem tất cả bộ từ' })).toHaveAttribute('href', '/sets');
  });

  it('hiện thao tác của từng thẻ do trang ghép vào', async () => {
    vi.mocked(listMySets).mockResolvedValue(list([set], 1));
    renderWithQuery(<MySets renderCardActions={({ title }) => <button>Thư mục {title}</button>} />);

    expect(await screen.findByRole('button', { name: `Thư mục ${set.title}` })).toBeInTheDocument();
  });

  it('hiện trạng thái trống', async () => {
    vi.mocked(listMySets).mockResolvedValue(list([], 0));
    renderWithQuery(<MySets />);

    expect(await screen.findByText('Chưa có bộ từ nào')).toBeInTheDocument();
  });

  it('đọc trang từ địa chỉ và tạo link phân trang', async () => {
    navigation.params = new URLSearchParams('page=2');
    vi.mocked(listMySets).mockResolvedValue(list([set], 41, 2));
    renderWithQuery(<MySets />);

    expect(await screen.findByText('Trang 2/3')).toBeInTheDocument();
    expect(listMySets).toHaveBeenCalledWith({ page: 2, limit: SETS_PAGE_SIZE });
    expect(screen.getByRole('link', { name: 'Trang trước' })).toHaveAttribute('href', '/sets');
    expect(screen.getByRole('link', { name: 'Trang sau' })).toHaveAttribute('href', '/sets?page=3');
  });

  it.each(['abc', '0', '-1', '1.5', '999999999'])('coi page=%s là trang đầu', async (page) => {
    navigation.params = new URLSearchParams({ page });
    vi.mocked(listMySets).mockResolvedValue(list([set], 1));
    renderWithQuery(<MySets />);

    await screen.findByText('Trái cây');
    expect(listMySets).toHaveBeenCalledWith({ page: 1, limit: SETS_PAGE_SIZE });
  });

  it('mời về trang đầu khi trang vượt quá danh sách', async () => {
    navigation.params = new URLSearchParams('page=9');
    vi.mocked(listMySets).mockResolvedValue(list([], 3, 9));
    renderWithQuery(<MySets />);

    expect(await screen.findByRole('link', { name: 'Về trang đầu' })).toHaveAttribute(
      'href',
      '/sets',
    );
  });

  it('báo lỗi và thử lại được', async () => {
    vi.mocked(listMySets).mockRejectedValueOnce(new Error('Mất mạng'));
    vi.mocked(listMySets).mockResolvedValue(list([set], 1));
    renderWithQuery(<MySets />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được bộ từ');
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Trái cây')).toBeInTheDocument();
  });
});

describe('RecentSets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lấy 5 bộ mới nhất và mời xem tất cả khi còn nữa', async () => {
    vi.mocked(listMySets).mockResolvedValue(list([set], 8, 1, 5));
    renderWithQuery(<RecentSets />);

    expect(await screen.findByRole('heading', { name: 'Bộ từ gần đây' })).toBeInTheDocument();
    expect(listMySets).toHaveBeenCalledWith({ page: 1, limit: 6 });
    expect(screen.getByRole('link', { name: 'Xem tất cả 8 bộ từ' })).toHaveAttribute(
      'href',
      '/sets',
    );
  });

  it('không hiện link khi đã đủ danh sách', async () => {
    vi.mocked(listMySets).mockResolvedValue(list([set], 1, 1, 5));
    renderWithQuery(<RecentSets />);

    await screen.findByText('Trái cây');
    expect(screen.getByRole('link', { name: 'Trái cây' })).toHaveAttribute('href', '/sets/s1');
    expect(screen.queryByRole('link', { name: /Xem tất cả/ })).not.toBeInTheDocument();
  });

  it('hiện trạng thái trống và lỗi', async () => {
    vi.mocked(listMySets).mockResolvedValueOnce(list([], 0, 1, 5));
    renderWithQuery(<RecentSets />);
    expect(await screen.findByText('Chưa có bộ từ nào')).toBeInTheDocument();

    vi.mocked(listMySets).mockRejectedValueOnce(new Error('Mất mạng'));
    renderWithQuery(<RecentSets />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được bộ từ gần đây');
  });
});
