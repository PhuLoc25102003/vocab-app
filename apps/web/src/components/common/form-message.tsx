import { CircleAlert, CircleCheck } from 'lucide-react';
import type { ReactNode } from 'react';

export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex gap-2 rounded-md bg-danger-soft p-3 text-small text-danger">
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}

export function FormNotice({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="flex gap-2 rounded-md bg-success-soft p-3 text-small text-success">
      <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}
