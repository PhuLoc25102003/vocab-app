import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { requestPasswordReset } from '../api';
import { ForgotPasswordForm } from './forgot-password-form';

vi.mock('../api');

const SENT = 'Nếu email này có tài khoản, thư đặt lại mật khẩu sẽ tới trong vài phút.';

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('kiểm tra email trước khi gửi', async () => {
    render(<ForgotPasswordForm />);

    await userEvent.type(screen.getByLabelText('Email'), 'khong-phai-email');
    await userEvent.click(screen.getByRole('button', { name: 'Gửi liên kết' }));

    expect(await screen.findByText(/email/i, { selector: '[id$="-error"]' })).toBeInTheDocument();
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it('gửi email rồi hiện thông báo của server, cho gửi lại', async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue(SENT);
    render(<ForgotPasswordForm />);

    await userEvent.type(screen.getByLabelText('Email'), ' AN@example.com ');
    await userEvent.click(screen.getByRole('button', { name: 'Gửi liên kết' }));

    expect(await screen.findByRole('status')).toHaveTextContent(SENT);
    expect(requestPasswordReset).toHaveBeenCalledWith({ email: 'an@example.com' });
    expect(screen.getByRole('link', { name: 'Quay lại đăng nhập' })).toHaveAttribute(
      'href',
      '/login',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Gửi lại' }));
    expect(screen.getByLabelText('Email')).toHaveValue('AN@example.com');
  });

  it('lỗi mạng hoặc vượt giới hạn thì báo ở đầu form', async () => {
    vi.mocked(requestPasswordReset).mockRejectedValue(
      new HttpError('Bạn thử quá nhiều lần, hãy đợi một lát.', 429, 'RATE_LIMITED'),
    );
    render(<ForgotPasswordForm />);

    await userEvent.type(screen.getByLabelText('Email'), 'an@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Gửi liên kết' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Bạn thử quá nhiều lần');
  });
});
