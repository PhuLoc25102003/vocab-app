const GOOGLE_IDENTITY_URL = 'https://accounts.google.com/gsi';
const DEFAULT_API_URL = 'http://localhost:4000/api/v1';

interface SecurityHeaderOptions {
  apiUrl?: string;
  isDev: boolean;
}

/**
 * Trang dùng prerender một phần nên không gắn được nonce vào script của phần tĩnh.
 * Vì vậy `script-src` phải có `'unsafe-inline'`, các nguồn ngoài vẫn bị giới hạn.
 */
export function buildContentSecurityPolicy({ apiUrl, isDev }: SecurityHeaderOptions): string {
  // Đường dẫn tương đối là API được chuyển tiếp qua chính web, đã nằm trong 'self'.
  const apiOrigin = apiUrl?.startsWith('/') ? '' : new URL(apiUrl || DEFAULT_API_URL).origin;
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${GOOGLE_IDENTITY_URL}/client${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'unsafe-inline' ${GOOGLE_IDENTITY_URL}/style`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    ['connect-src', "'self'", apiOrigin, `${GOOGLE_IDENTITY_URL}/`, isDev ? 'ws:' : '']
      .filter(Boolean)
      .join(' '),
    // `read-excel-file` đọc file Excel trong worker tạo từ `blob:` (ADR 0002).
    "worker-src 'self' blob:",
    `frame-src ${GOOGLE_IDENTITY_URL}/`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  return directives.join('; ');
}

export function buildSecurityHeaders(options: SecurityHeaderOptions) {
  const headers = [
    { key: 'Content-Security-Policy', value: buildContentSecurityPolicy(options) },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    // Chế độ Luyện nói cần micro của chính trang, không cho iframe hay trang khác.
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
    // Popup đăng nhập Google cần giữ liên lạc với trang mở nó.
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  ];
  if (!options.isDev) {
    headers.push({ key: 'Strict-Transport-Security', value: 'max-age=31536000' });
  }
  return headers;
}
