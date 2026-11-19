import type { NextConfig } from 'next';
import { buildSecurityHeaders } from './src/lib/security-headers';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Không có tên miền chung thì web và API khác trang, trình duyệt chặn cookie refresh.
  // Chuyển tiếp qua web để cookie là cookie cùng trang.
  async rewrites() {
    const target = process.env.API_INTERNAL_URL;
    return target ? [{ source: '/api/v1/:path*', destination: `${target}/:path*` }] : [];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: buildSecurityHeaders({
          apiUrl: process.env.NEXT_PUBLIC_API_URL,
          isDev: process.env.NODE_ENV === 'development',
        }),
      },
    ];
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
