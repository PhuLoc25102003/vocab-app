import { cn } from '@/lib/utils';

interface CardImageProps {
  src: string;
  alt: string;
  className?: string;
}

/** Ảnh minh hoạ của thẻ, nằm ở kho ảnh ngoài nên không qua bộ tối ưu ảnh của Next. */
export function CardImage({ src, alt, className }: CardImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn('rounded-md border border-border bg-bg object-cover', className)}
    />
  );
}
