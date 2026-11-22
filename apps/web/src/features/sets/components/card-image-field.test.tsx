import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Card, SetDetail } from '@vocab/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { getSet, getUploadConfig, replaceCards, updateSet, uploadCardImage } from '../api';
import { EditSet } from './edit-set';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('../api');

const IMAGE = 'https://pub.r2.dev/cards/u1/tao.png';
const card = (id: string, term: string, imageUrl: string | null): Card => ({
  id,
  position: 0,
  term,
  definition: `nghĩa của ${term}`,
  phonetic: null,
  example: null,
  imageUrl,
  audioUrl: null,
});
const detail: SetDetail = {
  id: 's1',
  ownerId: 'u1',
  title: 'Trái cây',
  description: null,
  termLang: 'en',
  defLang: 'vi',
  visibility: 'PRIVATE',
  cardCount: 2,
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-18T05:00:00.000Z',
  owner: { displayName: 'An' },
  cards: [card('c1', 'apple', IMAGE), { ...card('c2', 'pear', null), position: 1 }],
};
const config = (images: boolean, imageSearch = false) => ({
  images,
  imageSearch,
  maxBytes: 1024 * 1024,
  contentTypes: ['image/png' as const, 'image/jpeg' as const, 'image/webp' as const],
});
const png = (bytes: number) => new File([new Uint8Array(bytes)], 'anh.png', { type: 'image/png' });

async function renderEditor() {
  vi.mocked(getSet).mockResolvedValue(detail);
  vi.mocked(updateSet).mockResolvedValue(detail);
  vi.mocked(replaceCards).mockResolvedValue();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <EditSet id="s1" />
    </QueryClientProvider>,
  );
  await screen.findByRole('listitem', { name: 'Thẻ 1' });
}
/** Ô ảnh chỉ hiện sau khi biết kho ảnh đã bật. */
const waitForImageFields = () => screen.findByRole('button', { name: 'Thêm ảnh cho thẻ 2' });
const cardGroup = (number: number) =>
  within(screen.getByRole('listitem', { name: `Thẻ ${number}` }));
const fileInput = (number: number) =>
  screen
    .getByRole('listitem', { name: `Thẻ ${number}` })
    .querySelector<HTMLInputElement>('input[type="file"]') as HTMLInputElement;
const saveCards = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Lưu bộ từ' }));
  await waitFor(() => expect(replaceCards).toHaveBeenCalled());
  return vi.mocked(replaceCards).mock.calls[0]?.[1].cards;
};

describe('ảnh của thẻ trong trình sửa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUploadConfig).mockResolvedValue(config(true));
  });

  it('chưa bật kho ảnh thì không có nút thêm ảnh', async () => {
    vi.mocked(getUploadConfig).mockResolvedValue(config(false));
    await renderEditor();

    await waitFor(() => expect(getUploadConfig).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /ảnh cho thẻ/ })).not.toBeInTheDocument();
  });

  it('tải ảnh lên ngay khi chọn, xem trước rồi lưu địa chỉ ảnh, gỡ ảnh thì lưu null', async () => {
    vi.mocked(uploadCardImage).mockResolvedValue('https://pub.r2.dev/cards/u1/le.webp');
    await renderEditor();
    await waitForImageFields();

    expect(cardGroup(1).getByRole('img', { name: 'Ảnh của thẻ 1' })).toHaveAttribute('src', IMAGE);
    await userEvent.upload(fileInput(2), png(2000));
    expect(await cardGroup(2).findByRole('img', { name: 'Ảnh của thẻ 2' })).toHaveAttribute(
      'src',
      'https://pub.r2.dev/cards/u1/le.webp',
    );
    expect(cardGroup(2).getByRole('button', { name: 'Đổi ảnh cho thẻ 2' })).toBeInTheDocument();
    await userEvent.click(cardGroup(1).getByRole('button', { name: 'Gỡ ảnh khỏi thẻ 1' }));
    expect(cardGroup(1).queryByRole('img')).not.toBeInTheDocument();

    const cards = await saveCards();
    expect(cards?.[0]).toMatchObject({ id: 'c1', imageUrl: null });
    expect(cards?.[1]).toMatchObject({ id: 'c2', imageUrl: 'https://pub.r2.dev/cards/u1/le.webp' });
  });

  it('báo lỗi khi ảnh sai loại, quá 1 MB hoặc tải lên thất bại', async () => {
    await renderEditor();
    await waitForImageFields();
    const input = fileInput(2);

    await userEvent.upload(input, new File(['x'], 'a.gif', { type: 'image/gif' }), {
      applyAccept: false,
    });
    expect(cardGroup(2).getByRole('alert')).toHaveTextContent('Chỉ nhận ảnh PNG, JPEG hoặc WebP');
    await userEvent.upload(input, png(1024 * 1024 + 1));
    expect(cardGroup(2).getByRole('alert')).toHaveTextContent('Ảnh lớn hơn 1 MB');
    expect(uploadCardImage).not.toHaveBeenCalled();

    vi.mocked(uploadCardImage).mockRejectedValue(
      new HttpError('Chưa bật tải ảnh lên. Hãy thử lại sau.', 503, 'UPLOADS_DISABLED'),
    );
    await userEvent.upload(input, png(10));
    expect(await cardGroup(2).findByRole('alert')).toHaveTextContent('Chưa bật tải ảnh lên');
    vi.mocked(uploadCardImage).mockRejectedValue(new TypeError('Failed to fetch'));
    await userEvent.upload(input, png(10));
    expect(await cardGroup(2).findByRole('alert')).toHaveTextContent('Không tải được ảnh lên');
    expect(cardGroup(2).queryByRole('img')).not.toBeInTheDocument();
  });
});
