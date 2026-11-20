import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

/**
 * `hrefFor`: số trang nằm trong URL, dùng cho danh sách chính của trang.
 * `onPageChange`: đổi trang bằng nút, dùng cho danh sách nằm trong một phần của trang.
 */
type PaginationProps = {
  page: number;
  pageCount: number;
} & (
  | { hrefFor: (page: number) => Route; onPageChange?: never }
  | { onPageChange: (page: number) => void; hrefFor?: never }
);

interface PageLinkProps {
  href: Route | null;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  children: ReactNode;
}

function PageLink({ href, onClick, disabled, label, children }: PageLinkProps) {
  if (onClick) {
    return (
      <Button variant="secondary" disabled={disabled} aria-label={label} onClick={onClick}>
        {children}
      </Button>
    );
  }
  if (!href) {
    return (
      <Button variant="secondary" disabled aria-label={label}>
        {children}
      </Button>
    );
  }
  return (
    <Button asChild variant="secondary">
      <Link href={href} aria-label={label}>
        {children}
      </Link>
    </Button>
  );
}

export function Pagination({ page, pageCount, hrefFor, onPageChange }: PaginationProps) {
  if (pageCount <= 1) {
    return null;
  }
  const target = (next: number, enabled: boolean) =>
    onPageChange
      ? { href: null, disabled: !enabled, onClick: () => onPageChange(next) }
      : { href: enabled ? hrefFor(next) : null };

  return (
    <nav aria-label="Phân trang" className="flex items-center justify-between gap-2">
      <PageLink {...target(page - 1, page > 1)} label="Trang trước">
        <ChevronLeft aria-hidden className="size-4" />
        Trước
      </PageLink>
      <p className="text-small whitespace-nowrap tabular-nums">
        Trang {page}/{pageCount}
      </p>
      <PageLink {...target(page + 1, page < pageCount)} label="Trang sau">
        Sau
        <ChevronRight aria-hidden className="size-4" />
      </PageLink>
    </nav>
  );
}
