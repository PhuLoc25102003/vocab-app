import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PublicSetList } from '@vocab/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listPublicSets } from '../api';
import { EXPLORE_PAGE_SIZE, ExploreSets } from './explore-sets';

const navigation = vi.hoisted(() => ({ params: new URLSearchParams(), push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.params,
}));
vi.mock('../api');

const result: PublicSetList = {
  data: [
    {
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
      owner: { displayName: 'Lan' },
    },
  ],
  meta: { page: 1, limit: EXPLORE_PAGE_SIZE, total: 1 },
};
const emptyResult: PublicSetList = { ...result, data: [], meta: { ...result.meta, total: 0 } };

function renderExplore() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ExploreSets />
    </QueryClientProvider>,
  );
}

describe('ExploreSets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.params = new URLSearchParams();
  });

  it('đưa khách tới trang công khai của bộ từ', async () => {
    vi.mocked(listPublicSets).mockResolvedValue(result);
    navigation.params = new URLSearchParams();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <ExploreSets audience="guest" />
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('link', { name: 'Trái cây' })).toHaveAttribute(
      'href',
      '/public/sets/s1',
    );
  });

  it('hiện bộ từ công khai kèm người tạo và mở được chi tiết', async () => {
    vi.mocked(listPublicSets).mockResolvedValue(result);
    renderExplore();

    expect(await screen.findByRole('link', { name: 'Trái cây' })).toHaveAttribute(
      'href',
      '/sets/s1',
    );
    expect(screen.getByText('Lan')).toBeInTheDocument();
  });

  it('tìm theo từ khoá trên URL', async () => {
    navigation.params = new URLSearchParams('q=fruit&page=2');
    vi.mocked(listPublicSets).mockResolvedValue(result);
    renderExplore();

    await screen.findByRole('link', { name: 'Trái cây' });
    expect(listPublicSets).toHaveBeenCalledWith({
      page: 2,
      limit: EXPLORE_PAGE_SIZE,
      q: 'fruit',
      sort: '-updatedAt',
    });
    expect(screen.getByRole('searchbox')).toHaveValue('fruit');
  });

  it('gửi tìm kiếm thì về trang đầu và bỏ khoảng trắng thừa', async () => {
    navigation.params = new URLSearchParams('page=3');
    vi.mocked(listPublicSets).mockResolvedValue(result);
    renderExplore();

    await userEvent.type(screen.getByRole('searchbox'), '  con vật {Enter}');

    expect(navigation.push).toHaveBeenCalledWith('/explore?q=con+v%E1%BA%ADt');
  });

  it('cho phép chọn sắp xếp theo nhiều tiêu chí', async () => {
    vi.mocked(listPublicSets).mockResolvedValue(result);
    renderExplore();

    const select = screen.getByRole('combobox', { name: /Sắp xếp/i });
    await userEvent.selectOptions(select, '-cardCount');

    expect(navigation.push).toHaveBeenCalledWith('/explore?sort=-cardCount');
  });

  it('báo không có kết quả và cho xem tất cả', async () => {
    navigation.params = new URLSearchParams('q=xyz');
    vi.mocked(listPublicSets).mockResolvedValue(emptyResult);
    renderExplore();

    expect(await screen.findByText('Không tìm thấy bộ từ phù hợp')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Xem tất cả' })).toHaveAttribute('href', '/explore');
  });

  it('báo trang trống khi số trang lớn hơn dữ liệu', async () => {
    navigation.params = new URLSearchParams('page=5');
    vi.mocked(listPublicSets).mockResolvedValue({ ...result, data: [] });
    renderExplore();

    expect(await screen.findByText('Trang này không có bộ từ')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Về trang đầu' })).toHaveAttribute('href', '/explore');
  });

  it('cho thử lại khi tải thất bại', async () => {
    vi.mocked(listPublicSets).mockRejectedValue(new Error('Network error'));
    renderExplore();

    expect(await screen.findByText('Không tải được bộ từ')).toBeInTheDocument();
    vi.mocked(listPublicSets).mockResolvedValue(result);
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByRole('link', { name: 'Trái cây' })).toBeInTheDocument();
  });
});
