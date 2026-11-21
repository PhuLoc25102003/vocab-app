'use client';

import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

export default function Loading() {
  const { t } = useTranslation();
  return (
    <LoadingState label={t('pages.loading')}>
      <Skeleton className="h-10 w-48 max-w-full" />
      <Skeleton className="h-6 w-full max-w-md" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </LoadingState>
  );
}
