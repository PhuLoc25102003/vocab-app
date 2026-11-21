'use client';

import { ErrorState } from '@/components/common/error-state';
import { useTranslation } from 'react-i18next';

export default function AppError({ retry }: { retry: () => void }) {
  const { t } = useTranslation();
  return (
    <ErrorState
      title={t('pages.loadFailed')}
      description={t('pages.checkNetwork')}
      onRetry={retry}
    />
  );
}
