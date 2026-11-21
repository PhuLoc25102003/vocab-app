import type { Metadata } from 'next';
import { PageHeader } from '@/components/common/page-header';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('auth');
  return { title: t('pages.forgotTitle') };
}

export default async function ForgotPasswordPage() {
  const t = await getT('auth');
  return (
    <>
      <PageHeader title={t('pages.forgotTitle')} description={t('pages.forgotDesc')} />
      <ForgotPasswordForm />
    </>
  );
}
