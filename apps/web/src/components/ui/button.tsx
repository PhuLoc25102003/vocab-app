import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import type { ButtonHTMLAttributes, Ref } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'relative inline-flex min-h-11 items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap disabled:pointer-events-none disabled:opacity-50 aria-busy:opacity-100',
  {
    variants: {
      variant: {
        // Kính Liquid Glass trong `globals.css`: nhuộm màu chính, kính trong, hiện kính khi rê chuột.
        primary: 'glass-button-tint',
        secondary: 'glass-button',
        ghost: 'glass-button-ghost',
        // Kính trong viền đỏ, chữ đỏ giữ tương phản AA ở cả hai theme, rê chuột phủ đỏ nhạt.
        danger:
          'glass-button border border-danger-mark/70 text-danger [--glass-hover:var(--danger-soft)]',
      },
      size: {
        default: 'px-4 py-2',
        icon: 'size-11',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Render class của nút lên phần tử con, ví dụ `Link`. */
  asChild?: boolean;
  /** Giữ nguyên kích thước, hiện vòng xoay và khoá bấm. */
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  asChild = false,
  children,
  className,
  disabled,
  loading = false,
  size,
  type = 'button',
  variant,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return (
      <Slot className={classes} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <span className="inline-flex items-center gap-2 opacity-0">{children}</span>
          <LoaderCircle
            aria-hidden
            className="absolute size-4 animate-spin motion-reduce:animate-none"
          />
        </>
      ) : (
        children
      )}
    </button>
  );
}
