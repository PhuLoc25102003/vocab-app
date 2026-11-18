/**
 * Cookie refresh nằm ở domain API nên `proxy.ts` không đọc được. Cookie này chỉ báo trình duyệt
 * có phiên để điều hướng sớm, không chứa bí mật và không dùng để phân quyền.
 */
export const SESSION_MARKER_COOKIE = 'vocab_session';

const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function write(value: string, maxAge: number): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${SESSION_MARKER_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function hasSessionMarker(): boolean {
  return document.cookie.split('; ').includes(`${SESSION_MARKER_COOKIE}=1`);
}

export function setSessionMarker(): void {
  write('1', MAX_AGE_SECONDS);
}

export function clearSessionMarker(): void {
  write('', 0);
}
