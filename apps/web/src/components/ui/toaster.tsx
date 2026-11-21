'use client';

import { Toaster as Sonner } from 'sonner';
import { useTheme } from '@/lib/use-theme';

/** Hiển thị thông báo gọi bằng `toast()` của `sonner`. */
export function Toaster() {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme}
      position="bottom-center"
      mobileOffset={{ bottom: '5rem' }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-center gap-3 rounded-md border border-border-strong bg-surface p-4 text-small',
          description: 'text-text-muted',
          success: 'text-success',
          error: 'text-danger',
          actionButton: 'ml-auto min-h-11 shrink-0 px-2 font-medium text-primary',
        },
      }}
    />
  );
}
