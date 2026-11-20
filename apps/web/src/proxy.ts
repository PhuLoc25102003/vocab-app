import { NextResponse, type NextRequest } from 'next/server';
import { safeNextPath } from '@/features/auth/next-path';
import { SESSION_MARKER_COOKIE } from '@/lib/session-marker';

const AUTH_PAGES = new Set(['/login', '/register']);
const HOME_PATH = '/dashboard';
/** Trang công khai của một bộ từ, không gồm trang học thử bên trong. */
const PUBLIC_SET_PATH = /^\/public\/sets\/([^/]+)\/?$/;

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
  // Người đã đăng nhập xem bộ từ trong app để có tiến độ, lộ trình và nút sao chép.
  const publicSet = PUBLIC_SET_PATH.exec(pathname);
  if (publicSet) {
    return hasSession
      ? NextResponse.redirect(new URL(`/sets/${publicSet[1]}${search}`, request.url))
      : NextResponse.next();
  }
  if (hasSession) {
    return NextResponse.next();
  }

  // Khách vẫn tìm được bộ từ công khai, không cần đăng nhập.
  if (pathname === '/explore') {
    return NextResponse.redirect(new URL(`/public/explore${search}`, request.url));
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
    '/account/:path*',
    '/classes/:path*',
    '/login',
    '/register',
    '/public/sets/:id',
  ],
};
