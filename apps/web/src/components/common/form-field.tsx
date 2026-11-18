'use client';

import { useId, type ComponentProps, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface FieldText {
  label: string;
  hint?: string;
  error?: string;
}

interface ControlProps {
  id: string;
  'aria-invalid': true | undefined;
  'aria-describedby': string | undefined;
}

interface FieldShellProps extends FieldText {
  children: (control: ControlProps) => ReactNode;
}

function FieldShell({ label, hint, error, children }: FieldShellProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-small font-medium">
        {label}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
      })}
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

interface FormFieldProps extends FieldText, ComponentProps<typeof Input> {
  /** Nút nằm trong ô nhập, đặt `absolute` ở mép phải. */
  trailing?: ReactNode;
}

export function FormField({ label, hint, error, trailing, ...inputProps }: FormFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(control) => (
        <div className="relative">
          <Input {...control} {...inputProps} />
          {trailing}
        </div>
      )}
    </FieldShell>
  );
}

export function TextareaField({
  label,
  hint,
  error,
  ...props
}: FieldText & ComponentProps<typeof Textarea>) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(control) => <Textarea {...control} {...props} />}
    </FieldShell>
  );
}

export function SelectField({
  label,
  hint,
  error,
  ...props
}: FieldText & ComponentProps<typeof Select>) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(control) => <Select {...control} {...props} />}
    </FieldShell>
  );
}
