'use client';

import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MotionProvider } from '@/components/common/motion-provider';
import { Toaster } from '@/components/ui/toaster';
import { getQueryClient } from '@/lib/query-client';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <MotionProvider>{children}</MotionProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
