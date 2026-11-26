/**
 * Chạy ở `<head>` trước khi vẽ: chỉ Chromium (có `navigator.userAgentData`) vẽ được bộ lọc SVG
 * trong `backdrop-filter`, nên chỉ trình duyệt đó nhận `data-liquid` để bật khúc xạ kính.
 * Safari và Firefox giữ kính blur thường.
 */
export const liquidGlassInitScript =
  "if('userAgentData' in navigator)document.documentElement.setAttribute('data-liquid','')";

/**
 * Bộ lọc `#liquid-glass` cho `.glass-overlay`: nhiễu fractal kéo dãn ngang làm bản đồ dịch
 * chuyển, bẻ cong nền phía sau thành các gợn sóng như nhìn qua mặt nước. Không dùng
 * `display: none` vì trình duyệt sẽ bỏ luôn bộ lọc.
 */
export function LiquidGlassFilter() {
  return (
    <svg aria-hidden focusable="false" className="pointer-events-none absolute size-0">
      <filter
        id="liquid-glass"
        x="0%"
        y="0%"
        width="100%"
        height="100%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.007 0.018"
          numOctaves="2"
          seed="7"
          result="noise"
        />
        <feGaussianBlur in="noise" stdDeviation="2.5" result="ripple" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="ripple"
          scale="42"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
