import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpError } from '@/lib/http';
import { UnsubscribeForm } from './unsubscribe-form';

let params = new URLSearchParams('token=abc.def');
vi.mock('next/navigation', () => ({ useSearchParams: () => params }));
vi.mock('@/lib/http', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/http')>()),
  http: vi.fn(),
}));

function renderForm() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <UnsubscribeForm />
    </QueryClientProvider>,
  );
}

describe('UnsubscribeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    params = new URLSearchParams('token=abc.def');
  });

  it('chỉ huỷ khi người dùng bấm nút', async () => {
    vi.mocked(http).mockResolvedValue(undefined);
    renderForm();
    expect(http).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Huỷ nhận mail' }));
    expect(http).toHaveBeenCalledWith('/notifications/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ token: 'abc.def' }),
      skipAuth: true,
    });
    expect(await screen.findByText(/Đã huỷ nhận mail nhắc học/)).toBeInTheDocument();
  });

  it('báo lỗi khi token sai', async () => {
    vi.mocked(http).mockRejectedValue(
      new HttpError('Liên kết huỷ nhận mail không hợp lệ', 400, 'UNSUBSCRIBE_TOKEN_INVALID'),
    );
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Huỷ nhận mail' }));
    expect(
      await screen.findByText('Liên kết huỷ nhận mail không hợp lệ', { exact: false }),
    ).toBeInTheDocument();
  });

  it('thiếu token thì không có nút huỷ', () => {
    params = new URLSearchParams();
    renderForm();
    expect(screen.getByRole('alert')).toHaveTextContent(/Liên kết thiếu mã/);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
