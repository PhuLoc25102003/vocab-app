import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Khai báo token riêng để `text-small` không bị hiểu nhầm là màu chữ.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['card', 'card-long', 'h1', 'h2', 'h3', 'body', 'small', 'tiny'],
      shadow: ['raised'],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
