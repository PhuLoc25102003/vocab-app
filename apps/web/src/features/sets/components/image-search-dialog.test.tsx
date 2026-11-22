import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ImageSearchResultItem } from '@vocab/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { searchImages } from '../api';
import { ImageSearchDialog } from './image-search-dialog';

vi.mock('../api');

const mockPhotos: ImageSearchResultItem[] = [
  {
    id: 'photo-1',
    thumbUrl: 'https://images.unsplash.com/thumb-1.jpg',
    imageUrl: 'https://images.unsplash.com/regular-1.jpg',
    alt: 'fresh red apple',
    authorName: 'John Doe',
    authorUrl: 'https://unsplash.com/@johndoe',
    source: 'unsplash',
  },
  {
    id: 'photo-2',
    thumbUrl: 'https://pixabay.com/thumb-2.jpg',
    imageUrl: 'https://pixabay.com/regular-2.jpg',
    alt: 'green apple on tree',
    authorName: 'Jane Smith',
    authorUrl: 'https://pixabay.com/users/janesmith-123/',
    source: 'pixabay',
  },
];

function renderDialog(props: Partial<Parameters<typeof ImageSearchDialog>[0]> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onOpenChange = vi.fn();
  const onSelectImage = vi.fn();

  render(
    <QueryClientProvider client={queryClient}>
      <ImageSearchDialog
        open={true}
        onOpenChange={onOpenChange}
        initialQuery="apple"
        onSelectImage={onSelectImage}
        {...props}
      />
    </QueryClientProvider>,
  );

  return { onOpenChange, onSelectImage };
}

describe('ImageSearchDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchImages).mockResolvedValue(mockPhotos);
  });

  it('tự động tìm ảnh theo initialQuery khi mở', async () => {
    renderDialog();

    expect(screen.getByRole('heading', { name: 'Tìm ảnh minh hoạ' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nhập từ khoá/)).toHaveValue('apple');

    await waitFor(() => expect(searchImages).toHaveBeenCalledWith('apple'));
    expect(await screen.findByRole('img', { name: 'fresh red apple' })).toHaveAttribute(
      'src',
      'https://images.unsplash.com/thumb-1.jpg',
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('cho phép nhập từ khoá mới và tìm kiếm', async () => {
    renderDialog();
    await screen.findByRole('img', { name: 'fresh red apple' });

    const input = screen.getByPlaceholderText(/Nhập từ khoá/);
    await userEvent.clear(input);
    await userEvent.type(input, 'banana{enter}');

    await waitFor(() => expect(searchImages).toHaveBeenCalledWith('banana'));
  });

  it('bấm chọn ảnh thì gọi onSelectImage và đóng hộp thoại', async () => {
    const { onSelectImage, onOpenChange } = renderDialog();

    const photoButton = await screen.findByRole('button', {
      name: /Chọn ảnh fresh red apple của John Doe/,
    });
    await userEvent.click(photoButton);

    expect(onSelectImage).toHaveBeenCalledWith('https://images.unsplash.com/regular-1.jpg');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('bấm nút Đóng thì gọi onOpenChange(false)', async () => {
    const { onOpenChange } = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
