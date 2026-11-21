const DEFAULT_PATH = '/dashboard';
const BASE = 'http://vocab.invalid';

/** Chỉ nhận đường dẫn trong app, để `?next=` không chuyển người dùng sang trang ngoài. */
export function safeNextPath(value: string | null | undefined): string {
  if (!value?.startsWith('/')) {
    return DEFAULT_PATH;
  }
  try {
    const url = new URL(value, BASE);
    return url.origin === BASE ? `${url.pathname}${url.search}${url.hash}` : DEFAULT_PATH;
  } catch {
    return DEFAULT_PATH;
  }
}
