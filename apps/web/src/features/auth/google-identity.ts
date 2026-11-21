const SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const LOAD_TIMEOUT_MS = 10_000;

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

/** Script chỉ được khởi tạo một lần, dù trang đăng nhập và đăng ký cùng nằm trong bộ nhớ. */
export async function loadGoogleIdentity(clientId: string): Promise<GoogleIdentityClient> {
  const client =
    window.google?.accounts.id ??
    (await (loading ??= loadScript().finally(() => {
      loading = null;
    })));

  if (initializedClient !== client) {
    client.initialize({
      client_id: clientId,
      callback: ({ credential }) => credentialHandler?.(credential),
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
