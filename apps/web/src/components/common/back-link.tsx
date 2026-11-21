import { ChevronLeft } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';

export function BackLink({ href, label }: { href: Route; label: string }) {
  return (
    <Link
      href={href}
      className="-ml-1 -mb-4 inline-flex min-h-11 items-center gap-1 self-start text-small text-text-muted transition-colors duration-fast ease-standard hover:text-primary"
    >
      <ChevronLeft aria-hidden className="size-4" />
      {label}
    </Link>
  );
}
