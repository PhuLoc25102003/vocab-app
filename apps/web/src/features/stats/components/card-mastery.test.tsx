import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getCardProgress } from '../api';
import { CardMasteryBadge } from './card-mastery';

vi.mock('../api');

describe('CardMasteryBadge', () => {
  it('hiện mức nhớ bằng chữ và ngày ôn, các thẻ dùng chung một lần tải', async () => {
    vi.mocked(getCardProgress).mockResolvedValue([
      { cardId: 'c1', level: 'mastered', dueAt: new Date('2099-03-05T00:00:00Z') },
      { cardId: 'c2', level: 'learning', dueAt: new Date('2000-01-01T00:00:00Z') },
      { cardId: 'c3', level: 'new', dueAt: null },
    ]);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <CardMasteryBadge setId="s1" cardId="c1" />
        <CardMasteryBadge setId="s1" cardId="c2" />
        <CardMasteryBadge setId="s1" cardId="c3" />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Đã thuộc')).toBeInTheDocument();
    expect(screen.getByText(/^Ôn lại /)).toBeInTheDocument();
    expect(screen.getByText('Đang học')).toBeInTheDocument();
    expect(screen.getByText('Đã đến hạn ôn')).toBeInTheDocument();
    expect(screen.getByText('Mới')).toBeInTheDocument();
    expect(getCardProgress).toHaveBeenCalledOnce();
  });
});
