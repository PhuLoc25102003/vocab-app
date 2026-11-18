import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => Route;
}

interface PageLinkProps {
  href: Route | null;
  label: string;
  children: ReactNode;
}

function PageLink({ href, label, children }: PageLinkProps) {
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

export function Pagination({ page, pageCount, hrefFor }: PaginationProps) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <nav aria-label="Phân trang" className="flex items-center justify-between gap-2">
      <PageLink href={page > 1 ? hrefFor(page - 1) : null} label="Trang trước">
        <ChevronLeft aria-hidden className="size-4" />
        Trước
      </PageLink>
      <p className="text-small whitespace-nowrap tabular-nums">
        Trang {page}/{pageCount}
      </p>
      <PageLink href={page < pageCount ? hrefFor(page + 1) : null} label="Trang sau">
        Sau
        <ChevronRight aria-hidden className="size-4" />
      </PageLink>
    </nav>
  );
}
