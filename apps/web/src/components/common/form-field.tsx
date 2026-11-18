'use client';

import { useId, type ComponentProps, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';

interface FormFieldProps extends ComponentProps<typeof Input> {
  label: string;
  hint?: string;
  error?: string;
  /** Nút nằm trong ô nhập, đặt `absolute` ở mép phải. */
  trailing?: ReactNode;
}

export function FormField({ label, hint, error, trailing, ...inputProps }: FormFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-small font-medium">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          {...inputProps}
        />
        {trailing}
      </div>
      {hint ? (
        <p id={hintId} className="text-small text-text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-small text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
