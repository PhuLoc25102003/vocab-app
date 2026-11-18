import { ERROR_CODES } from '@vocab/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { registerAccount } from '../api';
import { RegisterForm } from './register-form';

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: navigation.replace }),
  useSearchParams: () => navigation.params,
}));
vi.mock('../api');

async function fillRegister() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Tên hiển thị'), 'An');
  await user.type(screen.getByLabelText('Email'), 'an@example.com');
  await user.type(screen.getByLabelText('Mật khẩu'), 'mat-khau-dai');
  await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));
}

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.params = new URLSearchParams();
  });

  it('đăng ký rồi chuyển sang đăng nhập, giữ next', async () => {
    navigation.params = new URLSearchParams('next=/sets');
    vi.mocked(registerAccount).mockResolvedValue();
    render(<RegisterForm />);

    await fillRegister();

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith('/login?registered=1&next=%2Fsets'),
    );
    expect(screen.getByLabelText('Mật khẩu')).toHaveValue('');
  });

  it('gắn lỗi validate của máy chủ vào đúng ô', async () => {
    vi.mocked(registerAccount).mockRejectedValue(
      new HttpError('Dữ liệu không hợp lệ', 400, ERROR_CODES.VALIDATION_ERROR, [
        { path: 'email', code: 'custom', message: 'Email không dùng được' },
      ]),
    );
    render(<RegisterForm />);

    await fillRegister();

    expect(await screen.findByText('Email không dùng được')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
