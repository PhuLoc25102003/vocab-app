'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@vocab/shared';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormField } from '@/components/common/form-field';
import { FormError, FormNotice } from '@/components/common/form-message';
import { Button } from '@/components/ui/button';
import { applyFormError } from '@/lib/form-errors';
import { requestPasswordReset } from '../api';

const FIELDS = ['email'] as const;
const linkClass =
  'inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4';

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      setSent(await requestPasswordReset(values));
    } catch (error) {
      setFormError(applyFormError(error, FIELDS, setError));
    }
  });

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <FormNotice>{sent}</FormNotice>
        <p className="text-text-muted">
          Thư gửi tới{' '}
          <span className="font-medium text-text wrap-anywhere">{getValues('email')}</span>. Liên
          kết dùng được một lần trong 30 phút.
        </p>
        <Button asChild>
          <Link href="/login">Quay lại đăng nhập</Link>
        </Button>
        <p className="text-small text-text-muted">
          Chưa thấy thư?{' '}
          <button type="button" className={linkClass} onClick={() => setSent(null)}>
            Gửi lại
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <FormError>{formError}</FormError> : null}
      <FormField
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        hint="Email bạn dùng để đăng nhập Nhớ Từ."
        error={errors.email?.message}
        {...register('email')}
      />
      <Button type="submit" loading={isSubmitting}>
        Gửi liên kết
      </Button>
      <p className="text-small text-text-muted">
        Nhớ ra mật khẩu rồi?{' '}
        <Link href="/login" className={linkClass}>
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
