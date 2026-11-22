import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'min-h-11 w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2 text-body transition-colors duration-fast ease-standard hover:border-text-muted focus-visible:border-primary disabled:bg-bg aria-invalid:border-danger-mark',
        className,
      )}
      {...props}
    />
  );
}
