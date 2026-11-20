import { ERROR_CODES, type AuthSession } from '@vocab/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { login } from '../api';
import { useAuthStore } from '../store';
import { LoginForm } from './login-form';

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: navigation.replace, refresh: navigation.refresh }),
  useSearchParams: () => navigation.params,
}));
vi.mock('../api');

const session: AuthSession = {
  accessToken: 'token',
  user: { id: 'u1', email: 'an@example.com', displayName: 'An', role: 'STUDENT' },
};

async function fillLogin(password = 'mat-khau-dai') {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), 'AN@example.com');
  await user.type(screen.getByLabelText('Mật khẩu'), password);
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.params = new URLSearchParams();
    useAuthStore.setState({ status: 'loading', user: null, accessToken: null });
  });

  it('đăng nhập rồi về trang trong next', async () => {
    navigation.params = new URLSearchParams('next=/sets');
    vi.mocked(login).mockResolvedValue(session);
    render(<LoginForm />);

    await fillLogin();

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/sets'));
    expect(login).toHaveBeenCalledWith({ email: 'an@example.com', password: 'mat-khau-dai' });
    expect(useAuthStore.getState().accessToken).toBe('token');
    expect(screen.getByLabelText('Mật khẩu')).toHaveValue('');
  });

  it('xoá cache router trước khi chuyển trang, không dùng lại prefetch lúc chưa đăng nhập', async () => {
    vi.mocked(login).mockResolvedValue(session);
    render(<LoginForm />);

    await fillLogin();

    await waitFor(() => expect(navigation.replace).toHaveBeenCalled());
    expect(navigation.refresh).toHaveBeenCalledTimes(1);
    expect(navigation.refresh.mock.invocationCallOrder[0]).toBeLessThan(
      navigation.replace.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('không chuyển sang trang ngoài', async () => {
    navigation.params = new URLSearchParams('next=//evil.example');
    vi.mocked(login).mockResolvedValue(session);
    render(<LoginForm />);

    await fillLogin();

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/dashboard'));
  });

  it('báo lỗi từng ô và không gọi API khi thiếu dữ liệu', async () => {
    render(<LoginForm />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByText('Hãy nhập mật khẩu')).toBeInTheDocument();
    expect(screen.getByLabelText('Mật khẩu')).toHaveAttribute('aria-invalid', 'true');
    expect(login).not.toHaveBeenCalled();
  });

  it('hiện lỗi đăng nhập từ máy chủ', async () => {
    vi.mocked(login).mockRejectedValue(
      new HttpError('Email hoặc mật khẩu không đúng', 401, ERROR_CODES.INVALID_CREDENTIALS),
    );
    render(<LoginForm />);

    await fillLogin();

    expect(await screen.findByRole('alert')).toHaveTextContent('Email hoặc mật khẩu không đúng');
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('báo mất kết nối', async () => {
    vi.mocked(login).mockRejectedValue(new TypeError('Failed to fetch'));
    render(<LoginForm />);

    await fillLogin();

    expect(await screen.findByRole('alert')).toHaveTextContent('Không kết nối được máy chủ');
  });
});
