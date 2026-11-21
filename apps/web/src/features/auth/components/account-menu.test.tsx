import { act, render, screen } from '@testing-library/react';
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

  it('đăng xuất rồi đăng nhập lại thì mục Đăng xuất bấm được, không còn "Đang đăng xuất"', async () => {
    signIn('STUDENT');
    render(<AccountMenu />);
    const trigger = () => screen.getByRole('button', { name: /^Tài khoản:/ });

    await userEvent.click(trigger());
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Đăng xuất' }));
    await userEvent.click(trigger());
    expect(await screen.findByRole('menuitem', { name: 'Đang đăng xuất' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await userEvent.keyboard('{Escape}');

    act(() => useAuthStore.getState().clearSession());
    act(() => signIn('STUDENT'));

    await userEvent.click(trigger());
    const item = await screen.findByRole('menuitem', { name: 'Đăng xuất' });
    expect(item).not.toHaveAttribute('aria-disabled');
    await userEvent.click(item);
    expect(signOut).toHaveBeenCalledTimes(2);
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
