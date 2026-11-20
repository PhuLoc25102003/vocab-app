import type { Card } from '@vocab/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';
import { CardList } from './card-list';

const cards: Card[] = Array.from({ length: 120 }, (_, index) => ({
  id: `c${index + 1}`,
  position: index,
  term: `term ${index + 1}`,
  definition: `nghĩa ${index + 1}`,
  phonetic: null,
  example: null,
  imageUrl: null,
  audioUrl: null,
}));

describe('CardList', () => {
  beforeAll(() => {
    // jsdom không có scrollIntoView.
    Element.prototype.scrollIntoView = () => undefined;
  });

  it('bộ dài chỉ hiện 50 thẻ một trang, chuyển trang bằng nút', async () => {
    render(<CardList cards={cards} termLang="en" defLang="vi" />);

    const list = screen.getByRole('list', { name: 'Thẻ 1 đến 50 trên 120' });
    expect(list.querySelectorAll(':scope > li')).toHaveLength(50);
    expect(screen.getByText('Trang 1/3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
    await userEvent.click(screen.getByRole('button', { name: 'Trang sau' }));

    const last = screen.getByRole('list', { name: 'Thẻ 101 đến 120 trên 120' });
    expect(last).toHaveAttribute('start', '101');
    expect(last.querySelectorAll(':scope > li')).toHaveLength(20);
    expect(screen.getByText('term 120')).toBeInTheDocument();
    expect(screen.queryByText('term 1')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trang sau' })).toBeDisabled();
  });

  it('bộ ngắn không có phân trang', () => {
    render(<CardList cards={cards.slice(0, 3)} termLang="en" defLang="vi" />);

    expect(screen.queryByRole('navigation', { name: 'Phân trang' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});
