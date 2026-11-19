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

  beforeEach(() => {
    vi.clearAllMocks();
    navigation.params = new URLSearchParams();
  });

  it('hiện bộ từ công khai kèm người tạo và mở được chi tiết', async () => {
    vi.mocked(listPublicSets).mockResolvedValue(result);
    renderExplore();

    expect(await screen.findByRole('link', { name: 'Trái cây' })).toHaveAttribute(
      'href',
      '/sets/s1',
    );
    expect(screen.getByText(/Tạo bởi Lan/)).toBeInTheDocument();
  });

  it('tìm theo từ khoá trên URL', async () => {
    navigation.params = new URLSearchParams('q=fruit&page=2');
    vi.mocked(listPublicSets).mockResolvedValue(result);
    renderExplore();

    await screen.findByRole('link', { name: 'Trái cây' });
    expect(listPublicSets).toHaveBeenCalledWith({ page: 2, limit: EXPLORE_PAGE_SIZE, q: 'fruit' });
    expect(screen.getByRole('searchbox')).toHaveValue('fruit');
  });

  it('gửi tìm kiếm thì về trang đầu và bỏ khoảng trắng thừa', async () => {
    navigation.params = new URLSearchParams('page=3');
    vi.mocked(listPublicSets).mockResolvedValue(result);
    renderExplore();

    await userEvent.type(screen.getByRole('searchbox'), '  con vật {Enter}');

    expect(navigation.push).toHaveBeenCalledWith('/explore?q=con+v%E1%BA%ADt');
  });

  it('báo không có kết quả và cho xem tất cả', async () => {
    navigation.params = new URLSearchParams('q=xyz');
    vi.mocked(listPublicSets).mockResolvedValue(emptyResult);
    renderExplore();

    expect(await screen.findByText('Không tìm thấy bộ từ phù hợp')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Xem tất cả' })).toHaveAttribute('href', '/explore');
  });

  it('báo khi chưa có bộ từ công khai', async () => {
    vi.mocked(listPublicSets).mockResolvedValue(emptyResult);
    renderExplore();

    expect(await screen.findByText('Chưa có bộ từ công khai')).toBeInTheDocument();
  });

  it('cho thử lại khi tải lỗi', async () => {
    vi.mocked(listPublicSets).mockRejectedValueOnce(new Error('offline'));
    vi.mocked(listPublicSets).mockResolvedValue(result);
    renderExplore();

    await userEvent.click(await screen.findByRole('button', { name: /thử lại/i }));

    expect(await screen.findByRole('link', { name: 'Trái cây' })).toBeInTheDocument();
  });
});
