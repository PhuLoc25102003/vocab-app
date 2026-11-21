import { ImageResponse } from 'next/og';
import { BRAND_COLORS } from '@/lib/brand';

const SIZES = new Set([192, 512]);

/** Icon PNG cho PWA: nền màu thương hiệu, hai thẻ chồng nhau, chừa lề an toàn cho maskable. */
export function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  return params.then(({ size: raw }) => {
    const size = Number(raw);
    if (!SIZES.has(size)) {
      return new Response('Not found', { status: 404 });
    }
    const unit = size / 32;
    return new ImageResponse(
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BRAND_COLORS.primary,
        }}
      >
        <div style={{ position: 'relative', display: 'flex', width: 18 * unit, height: 18 * unit }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 12 * unit,
              height: 10 * unit,
              border: `${unit}px solid ${BRAND_COLORS.onPrimary}`,
              borderRadius: 2 * unit,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: 14 * unit,
              height: 11 * unit,
              background: BRAND_COLORS.onPrimary,
              borderRadius: 3 * unit,
            }}
          />
        </div>
      </div>,
      { width: size, height: size, headers: { 'Cache-Control': 'public, max-age=86400' } },
    );
  });
}
