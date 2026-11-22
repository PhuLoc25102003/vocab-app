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
        'group inline-flex items-center gap-2 rounded-lg border border-border-strong bg-surface px-3.5 py-2 text-small font-medium text-text transition-all duration-fast hover:border-primary hover:bg-primary-soft hover:text-primary shadow-xs self-start',
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
