import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { refresh } from '../api';
import { useAuthStore } from '../store';
import { AuthGate } from './auth-gate';

const replace = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/sets',
}));
vi.mock('../api');

const session = {
  accessToken: 'token',
  user: { id: 'u1', email: 'an@example.com', displayName: 'An', role: 'STUDENT' as const },
};

describe('AuthGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ status: 'loading', user: null, accessToken: null });
  });

  it('khôi phục phiên rồi hiện nội dung', async () => {
    vi.mocked(refresh).mockResolvedValue(session);
    render(<AuthGate>Nội dung</AuthGate>);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(await screen.findByText('Nội dung')).toBeInTheDocument();
  });

  it('chuyển về đăng nhập khi không có phiên', async () => {
    vi.mocked(refresh).mockRejectedValue(new HttpError('Hết phiên', 401, 'REFRESH_TOKEN_INVALID'));
    render(<AuthGate>Nội dung</AuthGate>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login?next=%2Fsets'));
    expect(screen.queryByText('Nội dung')).not.toBeInTheDocument();
  });

  it('cho thử lại khi mất kết nối', async () => {
    vi.mocked(refresh)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(session);
    render(<AuthGate>Nội dung</AuthGate>);

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Nội dung')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
