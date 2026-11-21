import type { PublicSetSummary } from '@vocab/shared';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SetCardGrid } from './set-cards';

const set: PublicSetSummary = {
  id: 's1',
  ownerId: 'u1',
  title: 'Unit 2: Family',
  description: 'Từ vựng về gia đình',
  termLang: 'en',
  defLang: 'vi',
  visibility: 'PRIVATE',
  cardCount: 12,
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-19T00:00:00.000Z',
  owner: { displayName: 'Lộc' },
};

describe('SetCardGrid', () => {
  it('thẻ trong thư viện có phạm vi, số thẻ, mô tả, ngày cập nhật và link tới bộ', () => {
    render(<SetCardGrid sets={[set]} />);
    const card = within(screen.getByRole('listitem'));

    expect(card.getByRole('link', { name: 'Unit 2: Family' })).toHaveAttribute('href', '/sets/s1');
    expect(card.getByText('Riêng tư')).toBeInTheDocument();
    expect(card.getByText('12 thẻ')).toBeInTheDocument();
    expect(card.getByText('Từ vựng về gia đình')).toBeInTheDocument();
    expect(card.getByText('19/11/2026')).toBeInTheDocument();
    expect(card.queryByText('Lộc')).not.toBeInTheDocument();
  });

  it('thẻ cộng đồng có tác giả, không có nhãn phạm vi', () => {
    render(
      <SetCardGrid
        sets={[{ ...set, visibility: 'PUBLIC' }]}
        variant="community"
        hrefFor={(id) => `/public/sets/${id}`}
      />,
    );
    const card = within(screen.getByRole('listitem'));

    expect(card.getByText('Lộc')).toBeInTheDocument();
    expect(card.queryByText('Công khai')).not.toBeInTheDocument();
    expect(card.getByRole('link')).toHaveAttribute('href', '/public/sets/s1');
  });

  it('hiện thao tác riêng của từng thẻ', () => {
    render(
      <SetCardGrid sets={[set]} renderActions={({ title }) => <button>Menu {title}</button>} />,
    );

    expect(screen.getByRole('button', { name: 'Menu Unit 2: Family' })).toBeInTheDocument();
  });
});
