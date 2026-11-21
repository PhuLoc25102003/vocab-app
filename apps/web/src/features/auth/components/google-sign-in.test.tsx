import { ERROR_CODES, type AuthSession } from '@vocab/shared';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { loginWithGoogle } from '../api';
import { useAuthStore } from '../store';
import { GoogleSignIn } from './google-sign-in';

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

function stubGoogle() {
  const client = { initialize: vi.fn(), renderButton: vi.fn() };
  window.google = { accounts: { id: client } };
  return client;
}

async function renderReady() {
  const client = stubGoogle();
  render(<GoogleSignIn text="signin_with" />);
  await waitFor(() => expect(client.renderButton).toHaveBeenCalled());
  const { callback } = client.initialize.mock.calls[0]?.[0] as {
    callback: (response: { credential: string }) => void;
  };
  return { client, signIn: () => act(() => callback({ credential: 'google-token' })) };
}

describe('GoogleSignIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.params = new URLSearchParams();
    useAuthStore.setState({ status: 'loading', user: null, accessToken: null });
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'client-id');
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private readonly callback: ResizeObserverCallback) {}
        observe() {
          this.callback(
            [{ contentRect: { width: 368 } } as ResizeObserverEntry],
            this as unknown as ResizeObserver,
          );
        }
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    delete window.google;
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('không hiện gì khi chưa cấu hình Client ID', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', '');
    const client = stubGoogle();

    const { container } = render(<GoogleSignIn text="signin_with" />);

    expect(container).toBeEmptyDOMElement();
    expect(client.initialize).not.toHaveBeenCalled();
  });

  it('hiện nút Google vừa khung', async () => {
    const { client } = await renderReady();

    expect(client.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 'client-id' }),
    );
    expect(client.renderButton).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ width: 334, locale: 'vi', text: 'signin_with' }),
    );
  });

  it('đăng nhập rồi về trang trong next', async () => {
    navigation.params = new URLSearchParams('next=/sets');
    vi.mocked(loginWithGoogle).mockResolvedValue(session);
    const { signIn } = await renderReady();

    signIn();

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/sets'));
    expect(loginWithGoogle).toHaveBeenCalledWith({ credential: 'google-token' });
    expect(useAuthStore.getState().accessToken).toBe('token');
    // Bỏ prefetch lúc chưa đăng nhập trước khi chuyển trang.
    expect(navigation.refresh.mock.invocationCallOrder[0]).toBeLessThan(
      navigation.replace.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('không chuyển tới địa chỉ ngoài trang web', async () => {
    navigation.params = new URLSearchParams('next=https://example.com');
    vi.mocked(loginWithGoogle).mockResolvedValue(session);
    const { signIn } = await renderReady();

    signIn();

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/dashboard'));
  });

  it('báo trạng thái và bỏ qua lần bấm thứ hai khi đang đăng nhập', async () => {
    vi.mocked(loginWithGoogle).mockReturnValue(new Promise(() => undefined));
    const { signIn } = await renderReady();

    signIn();
    signIn();

    expect(screen.getByRole('status')).toHaveTextContent('Đang đăng nhập bằng Google');
    expect(loginWithGoogle).toHaveBeenCalledTimes(1);
  });

  it('báo lỗi khi email đã có tài khoản mật khẩu', async () => {
    const message = 'Email này đã có tài khoản. Hãy đăng nhập bằng email và mật khẩu.';
    vi.mocked(loginWithGoogle).mockRejectedValue(
      new HttpError(message, 409, ERROR_CODES.GOOGLE_EMAIL_IN_USE),
    );
    const { signIn } = await renderReady();

    signIn();

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('gợi ý dùng email khi không tải được script của Google', async () => {
    render(<GoogleSignIn text="signin_with" />);
    const script = document.head.querySelector<HTMLScriptElement>('script[src*="accounts.google"]');

    act(() => script?.onerror?.(new Event('error')));

    expect(await screen.findByText(/vẫn có thể dùng email và mật khẩu/)).toBeInTheDocument();
    expect(document.head.querySelector('script[src*="accounts.google"]')).toBeNull();
  });
});
