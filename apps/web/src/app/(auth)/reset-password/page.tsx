import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { AuthFormSkeleton } from '@/features/auth/components/auth-form-skeleton';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';
import { getT } from '@/lib/i18n/server';

// Không gửi đường dẫn có token sang trang khác qua header Referer.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('auth');
  return { title: t('pages.resetTitle'), referrer: 'no-referrer' };
}

export default async function ResetPasswordPage() {
  const t = await getT('auth');
  return (
    <>
      <PageHeader title={t('pages.resetTitle')} description={t('pages.resetDesc')} />
      <Suspense fallback={<AuthFormSkeleton />}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
