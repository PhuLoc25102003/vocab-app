import { ArrowLeft } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function BackLink({
  href,
  label,
  className,
}: {
  href: Route;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'glass-button group inline-flex min-h-11 items-center gap-2 self-start rounded-full px-4 py-2 text-small font-medium text-text hover:text-primary',
        className,
      )}
    >
      <ArrowLeft
        aria-hidden
        className="size-4 shrink-0 text-text-muted transition-transform duration-fast group-hover:-translate-x-0.5 group-hover:text-primary"
      />
      <span>{label}</span>
    </Link>
  );
}
