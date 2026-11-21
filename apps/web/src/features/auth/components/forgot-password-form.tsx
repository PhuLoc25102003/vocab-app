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
import { Trans, useTranslation } from 'react-i18next';

const FIELDS = ['email'] as const;
const linkClass =
  'inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4';

export function ForgotPasswordForm() {
  const { t } = useTranslation('auth');
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
          <Trans
            t={t}
            i18nKey="forgot.sentTo"
            values={{ email: getValues('email') }}
            components={[<span key="e" className="font-medium text-text wrap-anywhere" />]}
          />
        </p>
        <Button asChild>
          <Link href="/login">{t('forgot.back')}</Link>
        </Button>
        <p className="text-small text-text-muted">
          {t('forgot.noEmail')}{' '}
          <button type="button" className={linkClass} onClick={() => setSent(null)}>
            {t('forgot.resend')}
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
        hint={t('forgot.emailHint')}
        error={errors.email?.message}
        {...register('email')}
      />
      <Button type="submit" loading={isSubmitting}>
        {t('forgot.submit')}
      </Button>
      <p className="text-small text-text-muted">
        {t('forgot.remembered')}{' '}
        <Link href="/login" className={linkClass}>
          {t('login')}
        </Link>
      </p>
    </form>
  );
}
