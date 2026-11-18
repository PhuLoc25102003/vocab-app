import type { Route } from 'next';
import Link from 'next/link';

export const BRAND_NAME = 'Nhớ Từ';

/** Xấp thẻ flashcard, thẻ trên cùng có dấu tích của một từ đã nhớ. */
function LogoMark() {
  return (
    <svg aria-hidden viewBox="0 0 32 32" className="size-8 shrink-0">
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <rect
        x="12"
        y="7"
        width="13"
        height="11"
        rx="2"
        fill="none"
        strokeWidth="2"
        className="stroke-primary-fg"
      />
      <rect
        x="6.5"
        y="11.5"
        width="17"
        height="14"
        rx="3"
        strokeWidth="1.5"
        className="fill-primary-fg stroke-primary"
      />
      <path
        d="m11 18.5 3 3 5.5-6"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary"
      />
    </svg>
  );
}

export function Logo({ href }: { href: Route }) {
  return (
    <Link href={href} className="flex min-h-11 shrink-0 items-center gap-2 font-card text-h3">
      <LogoMark />
      {BRAND_NAME}
    </Link>
  );
}
