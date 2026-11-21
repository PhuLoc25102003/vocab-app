'use client';

import { ERROR_CODES } from '@vocab/shared';
import Link from 'next/link';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { HttpError } from '@/lib/http';
import { useTranslation } from 'react-i18next';

interface SetLoadFailureProps {
  error: unknown;
  onRetry: () => void;
}

export function SetLoadFailure({ error, onRetry }: SetLoadFailureProps) {
  const { t } = useTranslation('sets');
  if (error instanceof HttpError && error.code === ERROR_CODES.SET_NOT_FOUND) {
    return (
      <EmptyState
        title={t('failure.notFound')}
        description={t('failure.notFoundHint')}
        action={
          <Button asChild variant="secondary">
            <Link href="/sets">{t('failure.backToList')}</Link>
          </Button>
        }
      />
    );
  }
  return <ErrorState title={t('loadFailed')} description={t('checkNetwork')} onRetry={onRetry} />;
}
