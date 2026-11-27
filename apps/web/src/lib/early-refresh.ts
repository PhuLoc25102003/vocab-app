import { SESSION_MARKER_COOKIE } from './session-marker';

/** Đường dẫn của nhóm route `(app)`, nơi `AuthGate` làm mới phiên ngay khi mở trang. */
export const APP_PATH_PREFIXES = [
  '/account',
  '/admin',
  '/classes',
  '/dashboard',
  '/explore',
  '/leaderboard',
  '/review',
  '/sets',
] as const;

const GLOBAL_KEY = '__vocabEarlyRefresh';

/**
 * Script đặt trong `<head>`: có cookie báo phiên và đang mở trang trong app thì gửi
 * `POST /auth/refresh` ngay lúc đọc HTML. Request chạy song song với lúc tải và chạy JS, thay vì
 * đợi React hydrate xong mới gửi. Cùng request, cùng cookie như `refresh()`, chỉ sớm hơn.
 */
export function earlyRefreshScript(apiUrl: string): string {
  const config = JSON.stringify({
    url: `${apiUrl}/auth/refresh`,
    prefixes: APP_PATH_PREFIXES,
    cookie: `${SESSION_MARKER_COOKIE}=1`,
    key: GLOBAL_KEY,
  }).replace(/</g, '\\u003c');
  return `(function(c){try{var p=location.pathname;if(document.cookie.split('; ').indexOf(c.cookie)<0)return;if(!c.prefixes.some(function(x){return p===x||p.indexOf(x+'/')===0}))return;var r=fetch(c.url,{method:'POST',credentials:'include'});r.catch(function(){});window[c.key]=r}catch(e){}})(${config})`;
}

/** Lấy request refresh mà script đã gửi, mỗi request chỉ dùng được một lần. */
export function takeEarlyRefresh(): Promise<Response> | null {
  if (typeof window === 'undefined') return null;
  const store = window as unknown as Record<string, Promise<Response> | undefined>;
  const pending = store[GLOBAL_KEY] ?? null;
  delete store[GLOBAL_KEY];
  return pending;
}
