'use client';

import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

export function SetDetailSkeleton() {
  const { t } = useTranslation('sets');
  return (
    <LoadingState label={t('loading')}>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64 max-w-full" />
        <Skeleton className="h-6 w-48 max-w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </LoadingState>
  );
}
