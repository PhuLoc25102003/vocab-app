import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_MARKER_COOKIE } from '@/lib/session-marker';

const AUTH_PAGES = new Set(['/login', '/register']);

/** Điều hướng sớm để tránh nháy trang. Quyền truy cập thật do API kiểm tra. */
export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_MARKER_COOKIE);

  if (AUTH_PAGES.has(pathname)) {
    return hasSession
      ? NextResponse.redirect(new URL('/dashboard', request.url))
      : NextResponse.next();
  }
  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/sets/:path*', '/review/:path*', '/login', '/register'],
};
