import { ERROR_CODES } from '@vocab/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { resetPassword } from '../api';
import { ResetPasswordForm } from './reset-password-form';

const navigation = vi.hoisted(() => ({ replace: vi.fn(), params: new URLSearchParams() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: navigation.replace }),
  useSearchParams: () => navigation.params,
}));
vi.mock('../api');

const token = 'a'.repeat(43);

async function submit(password: string) {
  await userEvent.type(screen.getByLabelText('Mật khẩu mới'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Đặt mật khẩu mới' }));
}

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.params = new URLSearchParams({ token });
    window.history.replaceState(null, '', `/reset-password?token=${token}`);
  });

  it('đặt mật khẩu mới, xoá token khỏi thanh địa chỉ rồi về đăng nhập', async () => {
    vi.mocked(resetPassword).mockResolvedValue();
    render(<ResetPasswordForm />);
    expect(window.location.search).toBe('');

    await submit('ngan');
    expect(await screen.findByText('Mật khẩu cần ít nhất 8 ký tự')).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();

    await userEvent.clear(screen.getByLabelText('Mật khẩu mới'));
    await submit('mat-khau-moi-123');

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/login?reset=1'));
    expect(resetPassword).toHaveBeenCalledWith({ token, password: 'mat-khau-moi-123' });
  });

  it('liên kết hết hạn hoặc đã dùng thì mời xin liên kết mới', async () => {
    vi.mocked(resetPassword).mockRejectedValue(
      new HttpError('Liên kết đã hết hạn', 400, ERROR_CODES.RESET_TOKEN_INVALID),
    );
    render(<ResetPasswordForm />);

    await submit('mat-khau-moi-123');

    expect(await screen.findByRole('alert')).toHaveTextContent('hết hạn hoặc đã được dùng');
    expect(screen.getByRole('link', { name: 'Gửi liên kết mới' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
    expect(screen.queryByLabelText('Mật khẩu mới')).not.toBeInTheDocument();
  });

  it('thiếu token thì không hiện form', () => {
    navigation.params = new URLSearchParams();
    render(<ResetPasswordForm />);

    expect(screen.getByRole('alert')).toHaveTextContent('Liên kết không đầy đủ');
    expect(screen.queryByLabelText('Mật khẩu mới')).not.toBeInTheDocument();
  });

  it('lỗi mạng thì giữ form và báo lỗi', async () => {
    vi.mocked(resetPassword).mockRejectedValue(new TypeError('fetch failed'));
    render(<ResetPasswordForm />);

    await submit('mat-khau-moi-123');

    expect(await screen.findByRole('alert')).toHaveTextContent('Không kết nối được máy chủ');
    expect(screen.getByLabelText('Mật khẩu mới')).toHaveValue('mat-khau-moi-123');
  });
});
