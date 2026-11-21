import type { MetadataRoute } from 'next';
import { BRAND_NAME } from '@/components/common/logo';
import { BRAND_COLORS } from '@/lib/brand';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND_NAME}: ôn từ vựng đúng lúc`,
    short_name: BRAND_NAME,
    description: 'Học từ vựng bằng flashcard và nhiều chế độ luyện tập, có lịch ôn cho từng thẻ.',
    lang: 'vi',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: BRAND_COLORS.background,
    theme_color: BRAND_COLORS.primary,
    icons: [
      { src: '/pwa-icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
