import { ERROR_CODES, type AuthSession } from '@vocab/shared';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@/lib/http';
import { createI18n } from '@/lib/i18n/config';
import { resources } from '@/lib/i18n/resources';
import { loginWithGoogle } from '../api';
import { refreshSession } from '../session';
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
vi.mock('../session', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../session')>()),
  refreshSession: vi.fn(),
}));

function stubPointer(coarse: boolean) {
  vi.mocked(window.matchMedia).mockImplementation(
    (query: string) => ({ matches: coarse && query === '(pointer: coarse)' }) as MediaQueryList,
  );
}

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
    sessionStorage.clear();
    stubPointer(false);
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
  describe('chế độ redirect trên mobile', () => {
    it('màn hình cảm ứng dùng redirect kèm nonce và nhớ trang cần về', async () => {
      stubPointer(true);
      navigation.params = new URLSearchParams('next=/sets/1');
      const setCookie = vi.spyOn(document, 'cookie', 'set');

      const { client } = await renderReady();

      expect(client.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          ux_mode: 'redirect',
          login_uri: expect.stringMatching(/\/auth\/google\/redirect$/),
          nonce: expect.any(String),
        }),
      );
      const { nonce } = client.initialize.mock.calls[0]?.[0] as { nonce: string };
      // Cookie chỉ gửi tới route redirect nên `document.cookie` của trang không đọc lại được.
      expect(setCookie).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(
            `^google_nonce=${nonce}; Path=/api/v1/auth/google/redirect;.*SameSite=None; Secure$`,
          ),
        ),
      );
      expect(sessionStorage.getItem('vocab.googleNext')).toBe('/sets/1');
    });

    it('máy tính giữ popup', async () => {
      const { client } = await renderReady();

      expect(client.initialize.mock.calls[0]?.[0]).not.toHaveProperty('ux_mode');
    });

    it('quay về với google=done thì lấy phiên rồi tới trang đã nhớ', async () => {
      stubPointer(true);
      sessionStorage.setItem('vocab.googleNext', '/sets/1');
      navigation.params = new URLSearchParams('google=done');
      vi.mocked(refreshSession).mockResolvedValue('token');
      stubGoogle();

      render(<GoogleSignIn text="signin_with" />);

      expect(screen.getByRole('status')).toHaveTextContent('Đang đăng nhập bằng Google');
      await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/sets/1'));
      expect(navigation.refresh).toHaveBeenCalled();
      expect(refreshSession).toHaveBeenCalledTimes(1);
    });

    it('báo lỗi khi không lấy được phiên', async () => {
      navigation.params = new URLSearchParams('google=done');
      vi.mocked(refreshSession).mockResolvedValue(null);
      stubGoogle();

      render(<GoogleSignIn text="signin_with" />);

      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(navigation.replace).not.toHaveBeenCalled();
    });

    it('hiện thông báo theo mã lỗi API gửi về', async () => {
      navigation.params = new URLSearchParams(`google_error=${ERROR_CODES.GOOGLE_EMAIL_IN_USE}`);
      stubGoogle();

      render(<GoogleSignIn text="signin_with" />);

      expect(await screen.findByRole('alert')).toHaveTextContent('Email này đã có tài khoản');
      expect(refreshSession).not.toHaveBeenCalled();
    });

    it('dịch thông báo lỗi và đặt locale tiếng Anh cho nút Google khi giao diện là tiếng Anh', async () => {
      createI18n('en', resources);
      navigation.params = new URLSearchParams(`google_error=${ERROR_CODES.ACCOUNT_LOCKED}`);
      const client = stubGoogle();

      render(<GoogleSignIn text="signin_with" />);

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'This account is locked. Contact an administrator.',
      );
      await waitFor(() => {
        expect(client.renderButton).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({ locale: 'en' }),
        );
      });
      createI18n('vi');
    });
  });
});
