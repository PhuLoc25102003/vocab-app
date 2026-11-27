'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { FormError, FormNotice } from '@/components/common/form-message';
import { Button } from '@/components/ui/button';
import { formErrorMessage } from '@/lib/form-errors';
import { unsubscribeReminders } from '../api';

/**
 * Trang mở từ link trong mail nhắc học. Phải bấm nút mới huỷ, để trình quét link của hộp thư không
 * tự huỷ thay người dùng.
 */
export function UnsubscribeForm() {
  const { t } = useTranslation('common');
  const token = useSearchParams().get('token') ?? '';
  const unsubscribe = useMutation({ mutationFn: () => unsubscribeReminders(token) });

  if (!token) {
    return <FormError>{t('unsubscribe.missing')}</FormError>;
  }
  if (unsubscribe.isSuccess) {
    return (
      <div className="flex flex-col items-start gap-4">
        <FormNotice>{t('unsubscribe.done')}</FormNotice>
        <Button asChild variant="secondary">
          <Link href="/">{t('unsubscribe.goHome')}</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-4">
      {unsubscribe.isError ? <FormError>{formErrorMessage(unsubscribe.error)}</FormError> : null}
      <Button loading={unsubscribe.isPending} onClick={() => unsubscribe.mutate()}>
        {t('unsubscribe.confirm')}
      </Button>
    </div>
  );
}
