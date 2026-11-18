import { ERROR_CODES, type AuthSession } from '@vocab/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import * as authApi from './api';
import { refreshSession, signOut, startSession } from './session';
import { useAuthStore } from './store';

vi.mock('./api');

const session: AuthSession = {
  accessToken: 'token',
  user: { id: 'u1', email: 'an@example.com', displayName: 'An', role: 'STUDENT' },
};
const invalid = new HttpError('Hết phiên', 401, ERROR_CODES.REFRESH_TOKEN_INVALID);
const inProgress = new HttpError('Đang làm mới', 409, ERROR_CODES.REFRESH_IN_PROGRESS);

describe('phiên đăng nhập', () => {
  beforeEach(() => {
    vi.mocked(authApi.refresh).mockReset();
    useAuthStore.setState({ status: 'loading', user: null, accessToken: null });
    document.cookie = 'vocab_session=; Path=/; Max-Age=0';
  });

  it('lưu phiên và đặt cookie đánh dấu khi refresh thành công', async () => {
    vi.mocked(authApi.refresh).mockResolvedValue(session);

    await expect(refreshSession()).resolves.toBe('token');

    expect(useAuthStore.getState()).toMatchObject({ status: 'authenticated', user: session.user });
    expect(document.cookie).toContain('vocab_session=1');
  });

  it('các lời gọi đồng thời chỉ refresh một lần', async () => {
    vi.mocked(authApi.refresh).mockResolvedValue(session);

    await Promise.all([refreshSession(), refreshSession(), refreshSession()]);

    expect(authApi.refresh).toHaveBeenCalledOnce();
  });

  it('thử lại khi tab khác đang refresh', async () => {
    vi.mocked(authApi.refresh).mockRejectedValueOnce(inProgress).mockResolvedValueOnce(session);

    await expect(refreshSession()).resolves.toBe('token');

    expect(authApi.refresh).toHaveBeenCalledTimes(2);
  });

  it('xoá phiên khi refresh token không còn hiệu lực', async () => {
    startSession(session);
    vi.mocked(authApi.refresh).mockRejectedValue(invalid);

    await expect(refreshSession()).resolves.toBeNull();

    expect(useAuthStore.getState()).toMatchObject({ status: 'anonymous', accessToken: null });
    expect(document.cookie).not.toContain('vocab_session=1');
  });

  it('giữ cookie đánh dấu khi không kết nối được máy chủ', async () => {
    document.cookie = 'vocab_session=1; Path=/';
    vi.mocked(authApi.refresh).mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(refreshSession()).resolves.toBeNull();

    expect(useAuthStore.getState().status).toBe('unavailable');
    expect(document.cookie).toContain('vocab_session=1');
  });

  it('đăng xuất xoá phiên dù máy chủ không phản hồi', async () => {
    startSession(session);
    vi.mocked(authApi.logout).mockRejectedValue(new TypeError('Failed to fetch'));

    await signOut();

    expect(useAuthStore.getState()).toMatchObject({ status: 'signed-out', accessToken: null });
    expect(document.cookie).not.toContain('vocab_session=1');
  });

  it('không đăng xuất người đang dùng khi máy chủ tạm lỗi', async () => {
    startSession(session);
    vi.mocked(authApi.refresh).mockRejectedValue(new HttpError('Lỗi', 503, 'SERVICE_UNAVAILABLE'));

    await refreshSession();

    expect(useAuthStore.getState()).toMatchObject({ status: 'authenticated', user: session.user });
  });
});
