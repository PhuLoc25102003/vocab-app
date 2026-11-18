import { NextResponse, type NextRequest } from 'next/server';
import { safeNextPath } from '@/features/auth/next-path';
import { SESSION_MARKER_COOKIE } from '@/lib/session-marker';

const AUTH_PAGES = new Set(['/login', '/register']);
const HOME_PATH = '/dashboard';

/** Người đã đăng nhập đi tiếp tới `next`, trừ khi `next` lại là trang đăng nhập. */
function signedInTarget(request: NextRequest): URL {
  const target = new URL(safeNextPath(request.nextUrl.searchParams.get('next')), request.url);
  return AUTH_PAGES.has(target.pathname) ? new URL(HOME_PATH, request.url) : target;
}

/** Điều hướng sớm để tránh nháy trang. Quyền truy cập thật do API kiểm tra. */
export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_MARKER_COOKIE);

  if (AUTH_PAGES.has(pathname)) {
    return hasSession ? NextResponse.redirect(signedInTarget(request)) : NextResponse.next();
  }
  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/sets/:path*',
    '/explore/:path*',
    '/review/:path*',
    '/login',
    '/register',
  ],
};
