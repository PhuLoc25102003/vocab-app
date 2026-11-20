import { describe, expect, it } from 'vitest';
import { buildContentSecurityPolicy, buildSecurityHeaders } from './security-headers';

const apiUrl = 'https://api.example.com/api/v1';

function directive(policy: string, name: string): string {
  return policy.split('; ').find((item) => item.startsWith(`${name} `)) ?? '';
}

describe('buildContentSecurityPolicy', () => {
  it('chỉ cho gọi API, Google và URL tải ảnh lên R2', () => {
    const connect = directive(buildContentSecurityPolicy({ apiUrl, isDev: false }), 'connect-src');

    expect(connect).toBe(
      "connect-src 'self' https://api.example.com https://accounts.google.com/gsi/ https://*.r2.cloudflarestorage.com",
    );
  });

  it('không thêm nguồn ngoài khi API được chuyển tiếp qua web', () => {
    const policy = buildContentSecurityPolicy({ apiUrl: '/api/v1', isDev: false });

    expect(directive(policy, 'connect-src')).toBe(
      "connect-src 'self' https://accounts.google.com/gsi/ https://*.r2.cloudflarestorage.com",
    );
  });

  it('chỉ hiện ảnh của app và ảnh thẻ trên R2', () => {
    const policy = buildContentSecurityPolicy({ apiUrl, isDev: false });

    expect(directive(policy, 'img-src')).toBe("img-src 'self' data: blob: https://*.r2.dev");
  });

  it('dùng API local khi chưa cấu hình', () => {
    const policy = buildContentSecurityPolicy({ apiUrl: '', isDev: false });

    expect(directive(policy, 'connect-src')).toContain('http://localhost:4000');
  });

  it('chặn nhúng trang và plugin', () => {
    const policy = buildContentSecurityPolicy({ apiUrl, isDev: false });

    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(directive(policy, 'worker-src')).toBe("worker-src 'self' blob:");
    expect(policy).toContain("base-uri 'self'");
  });

  it('chỉ nới eval và websocket khi phát triển', () => {
    const production = buildContentSecurityPolicy({ apiUrl, isDev: false });
    const development = buildContentSecurityPolicy({ apiUrl, isDev: true });

    expect(production).not.toContain('unsafe-eval');
    expect(production).not.toContain('ws:');
    expect(directive(development, 'script-src')).toContain("'unsafe-eval'");
    expect(directive(development, 'connect-src')).toContain('ws:');
  });
});

describe('buildSecurityHeaders', () => {
  const keys = (isDev: boolean) => buildSecurityHeaders({ apiUrl, isDev }).map(({ key }) => key);

  it('có đủ header cơ bản', () => {
    expect(keys(false)).toEqual(
      expect.arrayContaining([
        'Content-Security-Policy',
        'X-Content-Type-Options',
        'X-Frame-Options',
        'Referrer-Policy',
        'Permissions-Policy',
        'Cross-Origin-Opener-Policy',
      ]),
    );
  });

  it('chỉ cho chính trang dùng micro, chặn camera và vị trí', () => {
    const policy = buildSecurityHeaders({ isDev: false }).find(
      ({ key }) => key === 'Permissions-Policy',
    );
    expect(policy?.value).toBe('camera=(), microphone=(self), geolocation=()');
  });

  it('chỉ bật HSTS ở production', () => {
    expect(keys(false)).toContain('Strict-Transport-Security');
    expect(keys(true)).not.toContain('Strict-Transport-Security');
  });
});
