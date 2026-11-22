import { GOOGLE_NONCE_COOKIE, GOOGLE_NONCE_COOKIE_PATH } from '@vocab/shared';

const SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const LOAD_TIMEOUT_MS = 10_000;
const NONCE_MAX_AGE_SECONDS = 60 * 60;
const NEXT_STORAGE_KEY = 'vocab.googleNext';

export type GoogleButtonText = 'signin_with' | 'signup_with';

interface GoogleButtonOptions {
  type: 'standard';
  theme: 'outline';
  size: 'large';
  text: GoogleButtonText;
  shape: 'rectangular';
  logo_alignment: 'center';
  locale: string;
  width: number;
}

export interface GoogleIdentityClient {
  initialize(config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    ux_mode?: 'popup' | 'redirect';
    login_uri?: string;
    nonce?: string;
  }): void;
  renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentityClient } };
  }
}

type CredentialHandler = (credential: string) => void;

let loading: Promise<GoogleIdentityClient> | null = null;
let initializedClient: GoogleIdentityClient | null = null;
let credentialHandler: CredentialHandler | null = null;

/** Next thay giá trị này lúc build. Để trống thì không hiện đăng nhập Google. */
export function getGoogleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? '';
}

function loadScript(): Promise<GoogleIdentityClient> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const fail = () => {
      clearTimeout(timeout);
      script.remove();
      reject(new Error('Không tải được Google Identity Services'));
    };
    const timeout = setTimeout(fail, LOAD_TIMEOUT_MS);

    script.src = SCRIPT_URL;
    script.async = true;
    script.onerror = fail;
    script.onload = () => {
      const client = window.google?.accounts.id;
      if (!client) {
        fail();
        return;
      }
      clearTimeout(timeout);
      resolve(client);
    };
    document.head.append(script);
  });
}

/**
 * Popup của Google trên mobile mở sang tab hoặc trình duyệt khác (PWA đã cài, trình duyệt trong
 * Zalo, Messenger), mất `window.opener` nên kẹt ở trang trắng sau khi chọn tài khoản. Các máy này
 * dùng chế độ redirect: Google POST credential về API, API chuyển lại `/login?google=done`.
 */
export function usesGoogleRedirect(): boolean {
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

function redirectLoginUri(): string {
  const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL?.trim() || '/api/v1').replace(/\/+$/, '');
  if (/^https?:\/\//i.test(rawApiUrl)) {
    return `${rawApiUrl}/auth/google/redirect`;
  }
  const cleanPath = `/${rawApiUrl.replace(/^\/+/, '')}/auth/google/redirect`.replace(/\/+/g, '/');
  return new URL(cleanPath, window.location.origin).href;
}

/** API so nonce trong ID token với cookie này, trang lạ không đặt được nên không giả được form. */
function writeNonceCookie(nonce: string): void {
  document.cookie =
    `${GOOGLE_NONCE_COOKIE}=${nonce}; Path=${GOOGLE_NONCE_COOKIE_PATH}; ` +
    `Max-Age=${NONCE_MAX_AGE_SECONDS}; SameSite=None; Secure`;
}

/** Giữ `?next=` qua lượt chuyển sang Google, vì Google chỉ quay về `login_uri` cố định. */
export function rememberGoogleNext(next: string | null): void {
  try {
    if (next) {
      sessionStorage.setItem(NEXT_STORAGE_KEY, next);
    } else {
      sessionStorage.removeItem(NEXT_STORAGE_KEY);
    }
  } catch {
    // Không lưu được thì về trang mặc định sau khi đăng nhập.
  }
}

export function takeGoogleNext(): string | null {
  try {
    const next = sessionStorage.getItem(NEXT_STORAGE_KEY);
    sessionStorage.removeItem(NEXT_STORAGE_KEY);
    return next;
  } catch {
    return null;
  }
}

/** Script chỉ được khởi tạo một lần, dù trang đăng nhập và đăng ký cùng nằm trong bộ nhớ. */
export async function loadGoogleIdentity(clientId: string): Promise<GoogleIdentityClient> {
  const client =
    window.google?.accounts.id ??
    (await (loading ??= loadScript().finally(() => {
      loading = null;
    })));

  if (initializedClient !== client) {
    const redirect = usesGoogleRedirect();
    const nonce = redirect ? crypto.randomUUID() : undefined;
    if (nonce) {
      writeNonceCookie(nonce);
    }
    client.initialize({
      client_id: clientId,
      callback: ({ credential }) => credentialHandler?.(credential),
      ...(nonce ? { ux_mode: 'redirect', login_uri: redirectLoginUri(), nonce } : {}),
    });
    initializedClient = client;
  }
  return client;
}

/** Trang đang hiển thị nhận kết quả. Trả về hàm để ngừng nhận. */
export function listenForGoogleCredential(handler: CredentialHandler): () => void {
  credentialHandler = handler;
  return () => {
    if (credentialHandler === handler) {
      credentialHandler = null;
    }
  };
}
