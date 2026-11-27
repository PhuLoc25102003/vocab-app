import { useId } from 'react';

/**
 * Chiến đấu cơ của Mưa từ (cùng hình với `drawJet` trong `word-rain/renderer.ts`) vẽ bằng SVG
 * cho landing, để không phải tải canvas của trò chơi. Màu lấy từ token `--game-*`.
 */
export function FighterJet({ className }: { className?: string }) {
  const id = useId();
  const wing = `${id}-wing`;
  const hull = `${id}-hull`;
  const glass = `${id}-glass`;
  const flame = `${id}-flame`;
  return (
    <svg aria-hidden viewBox="-60 -64 120 150" className={className}>
      <defs>
        <linearGradient id={wing} x1="-56" x2="56" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--game-steel)" />
          <stop offset="0.5" stopColor="var(--game-ink-muted)" />
          <stop offset="1" stopColor="var(--game-steel)" />
        </linearGradient>
        <linearGradient id={hull} x1="-13" x2="13" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--game-steel)" />
          <stop offset="0.5" stopColor="var(--game-ink)" />
          <stop offset="1" stopColor="var(--game-steel)" />
        </linearGradient>
        <linearGradient id={glass} x1="-5" x2="5" y1="-42" y2="-16" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--game-ink)" />
          <stop offset="0.4" stopColor="var(--game-glow)" />
          <stop offset="1" stopColor="var(--game-sky-top)" />
        </linearGradient>
        <linearGradient id={flame} x1="0" x2="0" y1="34" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--highlight)" />
          <stop offset="0.35" stopColor="var(--game-glow)" />
          <stop offset="1" stopColor="var(--game-glow)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="landing-thrust" fill={`url(#${flame})`}>
        <path d="M-13 34 Q-8 84 -3 34Z" />
        <path d="M3 34 Q8 84 13 34Z" />
      </g>
      <path d="M0 -22 L56 24 L50 32 L10 22 L-10 22 L-50 32 L-56 24Z" fill={`url(#${wing})`} />
      <path d="M-6 22 L-26 40 L-6 36Z M6 22 L26 40 L6 36Z" fill="var(--game-steel)" />
      <rect x="-55" y="23" width="3" height="3" fill="var(--danger)" />
      <rect x="52" y="23" width="3" height="3" fill="var(--game-glow)" />
      <path d="M0 -60 C9 -42 12 -6 13 36 L-13 36 C-12 -6 -9 -42 0 -60Z" fill={`url(#${hull})`} />
      <path
        d="M-40 24 L-12 8 M40 24 L12 8"
        stroke="var(--game-glow)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <ellipse cx="0" cy="-30" rx="5.5" ry="13" fill={`url(#${glass})`} />
      <ellipse cx="-1.8" cy="-35" rx="1.3" ry="4.5" fill="var(--game-ink)" opacity="0.75" />
    </svg>
  );
}
