import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signOut } from '../session';
import { useAuthStore } from '../store';
import { AccountMenu } from './account-menu';

vi.mock('../session', () => ({ signOut: vi.fn() }));

const signIn = (role: 'STUDENT' | 'ADMIN') =>
  useAuthStore.getState().setSession({
    user: { id: 'u1', email: 'an@example.com', displayName: 'Nguyễn An', role },
    accessToken: 'token',
  });

describe('AccountMenu', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hiện tên và chữ cái đầu, mở menu bằng bàn phím', async () => {
    signIn('STUDENT');
    render(<AccountMenu />);

    const trigger = screen.getByRole('button', { name: /^Tài khoản:\s*Nguyễn An$/ });
    trigger.focus();
    await userEvent.keyboard('{Enter}');

    expect(await screen.findByRole('menuitem', { name: 'Tài khoản' })).toHaveAttribute(
      'href',
      '/account',
    );
    expect(screen.getByText('an@example.com')).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Quản lý người dùng' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Đăng xuất' }));
    expect(signOut).toHaveBeenCalledOnce();
  });

  it('ADMIN có thêm mục quản lý người dùng', async () => {
    signIn('ADMIN');
    render(<AccountMenu />);

    await userEvent.click(screen.getByRole('button', { name: /^Tài khoản:\s*Nguyễn An$/ }));

    expect(await screen.findByRole('menuitem', { name: 'Quản lý người dùng' })).toHaveAttribute(
      'href',
      '/admin/users',
    );
  });
});
