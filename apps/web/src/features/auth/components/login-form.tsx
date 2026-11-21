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
import { applyFormError, formErrorMessage } from '@/lib/form-errors';
import { safeNextPath } from '../next-path';
import { startSession } from '../session';
import { FormError, FormNotice } from '@/components/common/form-message';
import { useTranslation } from 'react-i18next';
import { toLocale } from '@/lib/i18n/config';

const FIELDS = ['email', 'password'] as const;

export function LoginForm() {
  const { t, i18n } = useTranslation('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
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
  const [rawError, setRawError] = useState<unknown | null>(null);
  // Giữ lỗi gốc để thông báo dịch lại khi đổi ngôn ngữ; lỗi theo trường chỉ gán một lần trong catch.
  const formError = rawError ? formErrorMessage(rawError, toLocale(i18n.language)) : null;

  const onSubmit = handleSubmit(async (values) => {
    setRawError(null);
    try {
      startSession(await login(values));
      // Next giữ trang cũ ẩn trong DOM, không để mật khẩu nằm lại trong form.
      reset();
      // Prefetch lúc chưa đăng nhập đã bị chuyển về /login, phải bỏ trước khi đi tiếp.
      router.refresh();
      router.replace(safeNextPath(next) as Route);
    } catch (error) {
      const message = applyFormError(error, FIELDS, setError, toLocale(i18n.language));
      setRawError(message === null ? null : error);
    }
  });

  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : '/register';

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {searchParams.get('registered') ? <FormNotice>{t('loginForm.registered')}</FormNotice> : null}
      {searchParams.get('reset') ? <FormNotice>{t('loginForm.reset')}</FormNotice> : null}
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
        label={t('password')}
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Link
        href="/forgot-password"
        className="-mt-2 inline-flex min-h-11 items-center self-end text-small font-medium text-primary underline underline-offset-4"
      >
        {t('loginForm.forgot')}
      </Link>
      <Button type="submit" loading={isSubmitting}>
        {t('login')}
      </Button>
      <p className="text-small text-text-muted">
        {t('loginForm.noAccount')}{' '}
        <Link
          href={registerHref as Route}
          className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4"
        >
          {t('register')}
        </Link>
      </p>
    </form>
  );
}
