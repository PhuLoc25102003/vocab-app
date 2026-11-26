import type { Route } from 'next';
import Link from 'next/link';

export const BRAND_NAME = 'Nhớ Từ';

/** Biểu trưng Nhớ Từ: hai thẻ flashcard xếp lớp hiện đại kèm dấu tích ghi nhớ. */
function LogoMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 36 36"
      className="size-8 shrink-0 transition-transform duration-fast ease-standard group-hover:scale-105"
    >
      {/* Nền bo góc squircle */}
      <rect width="36" height="36" rx="10" className="fill-primary" />
      <rect
        x="0.75"
        y="0.75"
        width="34.5"
        height="34.5"
        rx="9.25"
        fill="none"
        strokeWidth="1.5"
        className="stroke-primary-fg/20"
      />
      {/* Thẻ phía sau nghiêng nhẹ tạo chiều sâu */}
      <rect
        x="10.5"
        y="7.5"
        width="17"
        height="19"
        rx="4"
        transform="rotate(9 19 17)"
        className="fill-primary-fg/30"
      />
      {/* Thẻ phía trước sắc nét */}
      <rect x="7.5" y="9" width="18" height="19.5" rx="4.5" className="fill-primary-fg" />
      {/* Dấu tích ghi nhớ tối giản */}
      <path
        d="M12.5 19l2.75 2.75 5.75-6.25"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary"
      />
      {/* Điểm nhấn nhỏ ở góc trên thẻ */}
      <circle cx="21.5" cy="12.5" r="1.3" className="fill-primary/45" />
    </svg>
  );
}

export function Logo({ href }: { href: Route }) {
  return (
    <Link
      href={href}
      className="group flex min-h-11 shrink-0 items-center gap-2.5 font-card text-h3 font-bold tracking-tight text-text"
    >
      <LogoMark />
      <span>{BRAND_NAME}</span>
    </Link>
  );
}
