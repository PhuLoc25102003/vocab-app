import type { Metadata } from 'next';
import { PageHeader } from '@/components/common/page-header';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export const metadata: Metadata = { title: 'Quên mật khẩu' };

export default function ForgotPasswordPage() {
  return (
    <>
      <PageHeader
        title="Quên mật khẩu"
        description="Nhập email, chúng tôi gửi liên kết để bạn đặt mật khẩu mới."
      />
      <ForgotPasswordForm />
    </>
  );
}
