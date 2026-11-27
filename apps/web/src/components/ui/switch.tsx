'use client';

import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange' | 'role' | 'type'
> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** Công tắc bật tắt, cùng kiểu với công tắc âm thanh ở trang Tài khoản. Vùng bấm 44 px. */
export function Switch({ checked, onCheckedChange, className, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'group flex size-11 shrink-0 items-center justify-center rounded-full disabled:opacity-60',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          'flex h-6 w-10 items-center rounded-full border-2 p-0.5 transition-colors duration-fast ease-standard',
          checked ? 'border-primary bg-primary' : 'border-border-strong bg-surface',
        )}
      >
        <span
          className={cn(
            'size-4 rounded-full transition-transform duration-fast ease-standard motion-reduce:transition-none',
            checked ? 'translate-x-4 bg-primary-fg' : 'bg-text-muted',
          )}
        />
      </span>
    </button>
  );
}
