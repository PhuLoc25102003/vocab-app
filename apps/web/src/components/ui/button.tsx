import type { ButtonHTMLAttributes } from 'react';

export function Button({
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`min-h-11 rounded-md bg-primary px-4 py-2 font-medium text-primary-fg transition-colors duration-fast ease-standard hover:bg-primary-hover disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
