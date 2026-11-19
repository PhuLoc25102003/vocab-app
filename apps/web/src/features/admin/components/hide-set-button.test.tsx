import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hideSet, unhideSet } from '../api';
import { HideSetButton } from './hide-set-button';

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api')>()),
  hideSet: vi.fn(),
  unhideSet: vi.fn(),
}));

const hidden = { id: 's1', title: 'Bộ', hiddenAt: new Date(), hiddenReason: 'x', hiddenById: 'a' };

function renderButton(isHidden: boolean) {
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <HideSetButton setId="s1" hidden={isHidden} />
    </QueryClientProvider>,
  );
}

describe('HideSetButton', () => {
  beforeEach(() => vi.clearAllMocks());

  it('ẩn bộ từ cần lý do', async () => {
    vi.mocked(hideSet).mockResolvedValue(hidden);
    renderButton(false);

    await userEvent.click(screen.getByRole('button', { name: 'Ẩn bộ từ' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ẩn khỏi người khác' }));
    expect(await screen.findByText('Hãy nhập lý do ẩn')).toBeInTheDocument();
    expect(hideSet).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Lý do ẩn'), 'Spam');
    await userEvent.click(screen.getByRole('button', { name: 'Ẩn khỏi người khác' }));

    await waitFor(() => expect(hideSet).toHaveBeenCalledWith('s1', 'Spam'));
    expect(await screen.findByRole('button', { name: 'Ẩn bộ từ' })).toBeInTheDocument();
  });

  it('bỏ ẩn bộ đang bị ẩn', async () => {
    vi.mocked(unhideSet).mockResolvedValue({ ...hidden, hiddenAt: null, hiddenReason: null });
    renderButton(true);

    await userEvent.click(screen.getByRole('button', { name: 'Bỏ ẩn bộ từ' }));

    await waitFor(() => expect(unhideSet).toHaveBeenCalledWith('s1'));
  });
});
