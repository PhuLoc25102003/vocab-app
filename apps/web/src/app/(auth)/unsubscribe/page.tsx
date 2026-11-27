import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { AuthFormSkeleton } from '@/features/auth/components/auth-form-skeleton';
import { UnsubscribeForm } from '@/features/notifications/components/unsubscribe-form';
import { getT } from '@/lib/i18n/server';

// Không gửi đường dẫn có token sang trang khác qua header Referer.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('unsubscribe.title'), referrer: 'no-referrer' };
}

export default async function UnsubscribePage() {
  const t = await getT('common');
  return (
    <>
      <PageHeader title={t('unsubscribe.title')} description={t('unsubscribe.description')} />
      <Suspense fallback={<AuthFormSkeleton />}>
        <UnsubscribeForm />
      </Suspense>
    </>
  );
}
