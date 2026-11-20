import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ERROR_CODES, type Account } from '@vocab/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { changeDisplayName, changePassword, deleteAccount, getAccount, logoutAll } from '../api';
import { useAuthStore } from '../store';
import { AccountSettings } from './account-settings';

vi.mock('../api');

const account: Account = {
  id: 'u1',
  email: 'an@example.com',
  displayName: 'An',
  role: 'STUDENT',
  hasPassword: true,
};
const { hasPassword: _hasPassword, ...user } = account;
const wrongPassword = new HttpError('Sai', 422, ERROR_CODES.WRONG_PASSWORD);

async function renderSettings(value: Account = account) {
  vi.mocked(getAccount).mockResolvedValue(value);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AccountSettings />
    </QueryClientProvider>,
  );
  await screen.findByText('an@example.com');
}

describe('AccountSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setSession({ user, accessToken: 'token' });
  });

  it('đổi tên và cập nhật người dùng hiện tại', async () => {
    vi.mocked(changeDisplayName).mockResolvedValue({ user: { ...user, displayName: 'Bình' } });
    await renderSettings();

    const name = screen.getByLabelText('Tên hiển thị');
    await userEvent.clear(name);
    await userEvent.type(name, 'Bình');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu tên' }));

    await waitFor(() => expect(useAuthStore.getState().user?.displayName).toBe('Bình'));
    expect(useAuthStore.getState().accessToken).toBe('token');
  });

  it('báo sai mật khẩu hiện tại ở đúng ô', async () => {
    vi.mocked(changePassword).mockRejectedValue(wrongPassword);
    await renderSettings();

    await userEvent.type(screen.getByLabelText('Mật khẩu hiện tại'), 'mat-khau-cu');
    await userEvent.type(screen.getByLabelText('Mật khẩu mới'), 'mat-khau-moi-123');
    await userEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    expect(await screen.findByText('Mật khẩu hiện tại không đúng')).toBeInTheDocument();
    expect(screen.getByLabelText('Mật khẩu hiện tại')).toHaveAttribute('aria-invalid', 'true');
  });

  it('nhận phiên mới sau khi đổi mật khẩu', async () => {
    vi.mocked(changePassword).mockResolvedValue({ user, accessToken: 'token-moi' });
    await renderSettings();

    await userEvent.type(screen.getByLabelText('Mật khẩu hiện tại'), 'mat-khau-cu');
    await userEvent.type(screen.getByLabelText('Mật khẩu mới'), 'mat-khau-moi-123');
    await userEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    await waitFor(() => expect(useAuthStore.getState().accessToken).toBe('token-moi'));
    expect(screen.getByLabelText('Mật khẩu mới')).toHaveValue('');
  });

  it('ẩn đổi mật khẩu và không hỏi mật khẩu với tài khoản Google', async () => {
    vi.mocked(deleteAccount).mockResolvedValue(undefined);
    await renderSettings({ ...account, hasPassword: false });

    expect(screen.queryByLabelText('Mật khẩu hiện tại')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Xoá tài khoản' }));
    await userEvent.click(screen.getByRole('button', { name: 'Xoá vĩnh viễn' }));

    await waitFor(() => expect(deleteAccount).toHaveBeenCalledWith(undefined));
    await waitFor(() => expect(useAuthStore.getState().status).toBe('signed-out'));
  });

  it('giữ tài khoản khi nhập sai mật khẩu xác nhận', async () => {
    vi.mocked(deleteAccount).mockRejectedValue(wrongPassword);
    await renderSettings();

    await userEvent.click(screen.getByRole('button', { name: 'Xoá tài khoản' }));
    const dialog = screen.getByRole('dialog', { name: 'Xoá tài khoản?' });
    await userEvent.type(
      within(dialog).getByLabelText('Nhập mật khẩu để xác nhận'),
      'sai-mat-khau',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Xoá vĩnh viễn' }));

    expect(await screen.findByText('Mật khẩu không đúng')).toBeInTheDocument();
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('huỷ xoá thì không gọi API', async () => {
    await renderSettings();

    await userEvent.click(screen.getByRole('button', { name: 'Xoá tài khoản' }));
    await userEvent.click(screen.getByRole('button', { name: 'Giữ tài khoản' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(deleteAccount).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Xoá tài khoản' })).toBeInTheDocument();
  });

  it('đăng xuất mọi thiết bị sau khi xác nhận', async () => {
    vi.mocked(logoutAll).mockResolvedValue(undefined);
    await renderSettings();

    await userEvent.click(screen.getByRole('button', { name: 'Đăng xuất mọi thiết bị' }));
    expect(logoutAll).not.toHaveBeenCalled();
    const dialog = screen.getByRole('dialog', { name: 'Đăng xuất mọi thiết bị?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Đăng xuất tất cả' }));

    await waitFor(() => expect(useAuthStore.getState().status).toBe('signed-out'));
  });

  it('cho thử lại khi không tải được', async () => {
    vi.mocked(getAccount).mockRejectedValueOnce(new Error('offline'));
    vi.mocked(getAccount).mockResolvedValue(account);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <AccountSettings />
      </QueryClientProvider>,
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('an@example.com')).toBeInTheDocument();
  });
});
