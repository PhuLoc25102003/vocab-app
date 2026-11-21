import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { AuthFormSkeleton } from '@/features/auth/components/auth-form-skeleton';
import { GoogleSignIn } from '@/features/auth/components/google-sign-in';
import { LoginForm } from '@/features/auth/components/login-form';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('auth');
  return { title: t('pages.loginTitle') };
}

export default async function LoginPage() {
  const t = await getT('auth');
  return (
    <>
      <PageHeader title={t('pages.loginTitle')} description={t('pages.loginDesc')} />
      <Suspense fallback={<AuthFormSkeleton />}>
        <GoogleSignIn text="signin_with" />
        <LoginForm />
      </Suspense>
    </>
  );
}
