'use client';

import { ErrorState } from '@/components/common/error-state';
import { useTranslation } from 'react-i18next';

export default function PublicError({ retry }: { retry: () => void }) {
  const { t } = useTranslation('common');
  return (
    <ErrorState
      title={t('pages.loadFailed')}
      description={t('pages.checkNetwork')}
      onRetry={retry}
    />
  );
}
