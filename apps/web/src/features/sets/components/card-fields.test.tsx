import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Card, SetDetail, SetSummary } from '@vocab/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  description: null,
  termLang: 'en',
  defLang: 'vi',
  visibility: 'PRIVATE',
  cardCount: 2,
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-18T05:00:00.000Z',
};

function card(id: string, position: number, term: string, definition: string): Card {
  return {
    id,
    position,
    term,
    definition,
    phonetic: null,
    example: null,
    imageUrl: null,
    audioUrl: null,
  };
}

const detail: SetDetail = {
  ...summary,
  owner: { displayName: 'An' },
  cards: [card('c1', 0, 'apple', 'quả táo'), card('c2', 1, 'pear', 'quả lê')],
};

function renderWithQuery(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const cardGroup = (number: number) => within(screen.getByRole('group', { name: `Thẻ ${number}` }));
const save = () => userEvent.click(screen.getByRole('button', { name: 'Lưu bộ từ' }));

async function renderEditor() {
  vi.mocked(getSet).mockResolvedValue(detail);
  vi.mocked(updateSet).mockResolvedValue(summary);
  vi.mocked(replaceCards).mockResolvedValue();
  renderWithQuery(<EditSet id="s1" />);
  await screen.findByRole('group', { name: 'Thẻ 1' });
}

const savedCards = () => vi.mocked(replaceCards).mock.calls[0]?.[1].cards;

describe('CardFields', () => {
  beforeEach(() => vi.clearAllMocks());

  it('tạo bộ từ kèm thẻ và bỏ qua dòng trống', async () => {
    vi.mocked(createSet).mockResolvedValue(summary);
    renderWithQuery(<CreateSet />);
    await userEvent.type(screen.getByLabelText('Tên bộ từ'), 'Trái cây');
    await userEvent.type(cardGroup(2).getByLabelText('Từ'), 'apple');
    await userEvent.type(cardGroup(2).getByLabelText('Nghĩa'), 'quả táo');
    await save();

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/sets/s1'));
    expect(vi.mocked(createSet).mock.calls[0]?.[0].cards).toEqual([
      { term: 'apple', definition: 'quả táo' },
    ]);
  });

  it('báo lỗi dưới đúng ô của thẻ thiếu nghĩa', async () => {
    renderWithQuery(<CreateSet />);
    await userEvent.type(screen.getByLabelText('Tên bộ từ'), 'Trái cây');
    await userEvent.type(cardGroup(2).getByLabelText('Từ'), 'apple');
    await save();

    expect(await cardGroup(2).findByText('Hãy nhập định nghĩa')).toBeInTheDocument();
    expect(cardGroup(1).queryByText('Hãy nhập định nghĩa')).not.toBeInTheDocument();
    expect(createSet).not.toHaveBeenCalled();
  });

  it('giữ id khi sửa, đổi thứ tự và thêm thẻ mới', async () => {
    await renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Đưa thẻ 2 lên' }));
    await userEvent.click(screen.getByRole('button', { name: 'Thêm thẻ' }));
    await userEvent.type(cardGroup(3).getByLabelText('Từ'), 'kiwi');
    await userEvent.type(cardGroup(3).getByLabelText('Nghĩa'), 'quả kiwi');
    await save();

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/sets/s1'));
    expect(savedCards()).toEqual([
      { id: 'c2', term: 'pear', definition: 'quả lê' },
      { id: 'c1', term: 'apple', definition: 'quả táo' },
      { term: 'kiwi', definition: 'quả kiwi' },
    ]);
  });

  it('không gửi thẻ đã xoá', async () => {
    await renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Xoá thẻ 1' }));
    await save();

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/sets/s1'));
    expect(savedCards()).toEqual([{ id: 'c2', term: 'pear', definition: 'quả lê' }]);
  });

  it('khoá nút đưa lên ở thẻ đầu và đưa xuống ở thẻ cuối', async () => {
    await renderEditor();

    expect(screen.getByRole('button', { name: 'Đưa thẻ 1 lên' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Đưa thẻ 2 xuống' })).toBeDisabled();
  });

  it('không lưu thẻ khi lưu thông tin bộ từ thất bại', async () => {
    await renderEditor();
    vi.mocked(updateSet).mockRejectedValue(new Error('Mất mạng'));
    await save();

    expect(await screen.findByRole('alert')).toHaveTextContent('Không kết nối được máy chủ');
    expect(replaceCards).not.toHaveBeenCalled();
  });
});
