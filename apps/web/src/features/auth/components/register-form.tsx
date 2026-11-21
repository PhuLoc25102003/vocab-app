'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { PASSWORD_MIN_LENGTH, registerSchema, type RegisterInput } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormField } from '@/components/common/form-field';
import { PasswordField } from '@/components/common/password-field';
import { Button } from '@/components/ui/button';
import { registerAccount } from '../api';
import { applyFormError } from '@/lib/form-errors';
import { FormError } from '@/components/common/form-message';
import { useTranslation } from 'react-i18next';

const FIELDS = ['displayName', 'email', 'password'] as const;

export function RegisterForm() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const next = useSearchParams().get('next');
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  });
  const nextQuery = next ? `next=${encodeURIComponent(next)}` : '';

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await registerAccount(values);
      // Next giữ trang cũ ẩn trong DOM, không để mật khẩu nằm lại trong form.
      reset();
      router.replace(`/login?registered=1${nextQuery && `&${nextQuery}`}` as Route);
    } catch (error) {
      setFormError(applyFormError(error, FIELDS, setError));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <FormError>{formError}</FormError> : null}
      <FormField
        label={t('displayName')}
        autoComplete="name"
        error={errors.displayName?.message}
        {...register('displayName')}
      />
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
        autoComplete="new-password"
        hint={t('registerForm.passwordHint', { min: PASSWORD_MIN_LENGTH })}
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" loading={isSubmitting}>
        {t('registerForm.submit')}
      </Button>
      <p className="text-small text-text-muted">
        {t('registerForm.haveAccount')}{' '}
        <Link
          href={`/login${nextQuery && `?${nextQuery}`}` as Route}
          className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4"
        >
          {t('login')}
        </Link>
      </p>
    </form>
  );
}
