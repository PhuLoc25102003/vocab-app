'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormField } from '@/components/common/form-field';
import { PasswordField } from '@/components/common/password-field';
import { Button } from '@/components/ui/button';
import { login } from '../api';
import { applyFormError } from '@/lib/form-errors';
import { safeNextPath } from '../next-path';
import { startSession } from '../session';
import { FormError, FormNotice } from '@/components/common/form-message';

const FIELDS = ['email', 'password'] as const;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      startSession(await login(values));
      // Next giữ trang cũ ẩn trong DOM, không để mật khẩu nằm lại trong form.
      reset();
      // Prefetch lúc chưa đăng nhập đã bị chuyển về /login, phải bỏ trước khi đi tiếp.
      router.refresh();
      router.replace(safeNextPath(next) as Route);
    } catch (error) {
      setFormError(applyFormError(error, FIELDS, setError));
    }
  });

  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : '/register';

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {searchParams.get('registered') ? (
        <FormNotice>Nếu email này chưa được dùng, tài khoản đã sẵn sàng. Hãy đăng nhập.</FormNotice>
      ) : null}
      {searchParams.get('reset') ? (
        <FormNotice>Đã đặt mật khẩu mới. Hãy đăng nhập bằng mật khẩu mới.</FormNotice>
      ) : null}
      {formError ? <FormError>{formError}</FormError> : null}
      <FormField
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordField
        label="Mật khẩu"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Link
        href="/forgot-password"
        className="-mt-2 inline-flex min-h-11 items-center self-end text-small font-medium text-primary underline underline-offset-4"
      >
        Quên mật khẩu?
      </Link>
      <Button type="submit" loading={isSubmitting}>
        Đăng nhập
      </Button>
      <p className="text-small text-text-muted">
        Chưa có tài khoản?{' '}
        <Link
          href={registerHref as Route}
          className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4"
        >
          Đăng ký
        </Link>
      </p>
    </form>
  );
}
