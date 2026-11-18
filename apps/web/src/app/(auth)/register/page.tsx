import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { AuthFormSkeleton } from '@/features/auth/components/auth-form-skeleton';
import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata: Metadata = { title: 'Đăng ký' };

export default function RegisterPage() {
  return (
    <>
      <PageHeader title="Tạo tài khoản" description="Lưu bộ từ và tiến độ học của bạn." />
      <Suspense fallback={<AuthFormSkeleton />}>
        <RegisterForm />
      </Suspense>
    </>
  );
}
