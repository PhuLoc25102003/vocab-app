'use client';

import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

export function AuthFormSkeleton() {
  const { t } = useTranslation('auth');
  return (
    <LoadingState label={t('loadingForm')}>
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
    </LoadingState>
  );
}
