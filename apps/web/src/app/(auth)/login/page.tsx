import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { AuthFormSkeleton } from '@/features/auth/components/auth-form-skeleton';
import { GoogleSignIn } from '@/features/auth/components/google-sign-in';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = { title: 'Đăng nhập' };

export default function LoginPage() {
  return (
    <>
      <PageHeader title="Đăng nhập" description="Tiếp tục ôn các bộ từ của bạn." />
      <Suspense fallback={<AuthFormSkeleton />}>
        <GoogleSignIn text="signin_with" />
        <LoginForm />
      </Suspense>
    </>
  );
}
