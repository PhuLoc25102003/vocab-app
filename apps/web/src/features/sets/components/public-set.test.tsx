import { ERROR_CODES, type SetDetail } from '@vocab/shared';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { getSet } from '../api';
import { getPublicSet } from '../public-set';
import { PublicSet } from './public-set';

const navigation = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/cache', () => ({ cacheLife: vi.fn() }));
vi.mock('next/navigation', () => ({ notFound: navigation.notFound }));
vi.mock('../api');

const set: SetDetail = {
  id: 's1',
  ownerId: 'u1',
  title: 'Trái cây',
  description: null,
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
      phonetic: null,
      example: null,
      imageUrl: null,
      audioUrl: null,
    },
  ],
};

const notFoundError = new HttpError('Không tìm thấy bộ từ', 404, ERROR_CODES.SET_NOT_FOUND);

describe('getPublicSet', () => {
  beforeEach(() => vi.clearAllMocks());

  it('gọi API như khách', async () => {
    vi.mocked(getSet).mockResolvedValue(set);

    await expect(getPublicSet('s1')).resolves.toEqual(set);
    expect(getSet).toHaveBeenCalledWith('s1', { skipAuth: true });
  });

  it('trả null khi bộ từ không công khai', async () => {
    vi.mocked(getSet).mockRejectedValue(notFoundError);

    await expect(getPublicSet('s1')).resolves.toBeNull();
  });

  it('không che lỗi máy chủ', async () => {
    const error = new HttpError('Lỗi máy chủ', 500, ERROR_CODES.INTERNAL_ERROR);
    vi.mocked(getSet).mockRejectedValue(error);

    await expect(getPublicSet('s1')).rejects.toBe(error);
  });
});

describe('PublicSet', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hiện thẻ và mời đăng nhập để sao chép', async () => {
    vi.mocked(getSet).mockResolvedValue(set);
    render(await PublicSet({ id: 's1' }));

    expect(screen.getByRole('heading', { name: 'Trái cây' })).toBeInTheDocument();
    expect(screen.getByText('apple')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Đăng nhập để sao chép' })).toHaveAttribute(
      'href',
      '/login?next=%2Fsets%2Fs1',
    );
  });

  it('chuyển sang trang không tìm thấy khi không xem được', async () => {
    vi.mocked(getSet).mockRejectedValue(notFoundError);

    await expect(PublicSet({ id: 's1' })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(navigation.notFound).toHaveBeenCalled();
  });
});
