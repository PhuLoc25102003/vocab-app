import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signOut } from '../session';
import { useAuthStore } from '../store';
import { AccountMenu, formatShortName } from './account-menu';

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

  it('formatShortName chỉ giữ lại tên đệm và tên chính khi tên có từ 3 từ trở lên', () => {
    expect(formatShortName('Đặng Phú Lộc')).toBe('Phú Lộc');
    expect(formatShortName('Nguyễn Văn An')).toBe('Văn An');
    expect(formatShortName('Trần Thị Mai Phương')).toBe('Mai Phương');
    expect(formatShortName('Nguyễn An')).toBe('Nguyễn An');
    expect(formatShortName('Admin')).toBe('Admin');
    expect(formatShortName('')).toBe('');
  });

  it('tên dài (từ 3 từ trở lên) chỉ hiện tên đệm và tên chính trên thanh điều hướng để không vỡ layout', async () => {
    useAuthStore.getState().setSession({
      user: { id: 'u2', email: 'loc@example.com', displayName: 'Đặng Phú Lộc', role: 'STUDENT' },
      accessToken: 'token',
    });
    render(<AccountMenu />);

    // Nút hiển thị "Phú Lộc" thay vì toàn bộ "Đặng Phú Lộc"
    expect(screen.getByRole('button', { name: /^Tài khoản:\s*Phú Lộc$/ })).toBeInTheDocument();

    // Mở menu thì vẫn hiện đầy đủ họ và tên
    await userEvent.click(screen.getByRole('button', { name: /^Tài khoản:\s*Phú Lộc$/ }));
    expect(screen.getByText('Đặng Phú Lộc')).toBeInTheDocument();
  });
});
