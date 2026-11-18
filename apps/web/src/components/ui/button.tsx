import type { ButtonHTMLAttributes } from 'react';

export function Button({
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`rounded-md bg-primary px-4 py-2 font-medium text-primary-fg transition-opacity duration-fast hover:opacity-90 disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
