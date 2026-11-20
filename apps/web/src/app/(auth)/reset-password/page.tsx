import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { AuthFormSkeleton } from '@/features/auth/components/auth-form-skeleton';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

// Không gửi đường dẫn có token sang trang khác qua header Referer.
export const metadata: Metadata = { title: 'Đặt mật khẩu mới', referrer: 'no-referrer' };

export default function ResetPasswordPage() {
  return (
    <>
      <PageHeader title="Đặt mật khẩu mới" description="Chọn mật khẩu bạn sẽ dùng từ giờ." />
      <Suspense fallback={<AuthFormSkeleton />}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
