'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ERROR_CODES,
  PASSWORD_MIN_LENGTH,
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@vocab/shared';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormError } from '@/components/common/form-message';
import { PasswordField } from '@/components/common/password-field';
import { Button } from '@/components/ui/button';
import { applyFormError } from '@/lib/form-errors';
import { HttpError } from '@/lib/http';
import { resetPassword } from '../api';
import { useTranslation } from 'react-i18next';

const passwordSchema = resetPasswordSchema.pick({ password: true });
type PasswordInput = Pick<ResetPasswordInput, 'password'>;
const FIELDS = ['password'] as const;

function LinkProblem({ message }: { message: string }) {
  const { t } = useTranslation('auth');
  return (
    <div className="flex flex-col gap-4">
      <FormError>{message}</FormError>
      <Button asChild>
        <Link href="/forgot-password">{t('reset.newLink')}</Link>
      </Button>
    </div>
  );
}

export function ResetPasswordForm() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  // Giữ token trong bộ nhớ rồi xoá khỏi thanh địa chỉ để không lọt vào lịch sử hay ảnh chụp màn hình.
  const [token] = useState(() => searchParams.get('token') ?? '');
  const tokenValid = resetPasswordSchema.shape.token.safeParse(token).success;
  const [expired, setExpired] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '' },
  });

  useEffect(() => {
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const onSubmit = handleSubmit(async ({ password }) => {
    setFormError(null);
    try {
      await resetPassword({ token, password });
      reset();
      router.replace('/login?reset=1');
    } catch (error) {
      if (error instanceof HttpError && error.code === ERROR_CODES.RESET_TOKEN_INVALID) {
        setExpired(true);
        return;
      }
      setFormError(applyFormError(error, FIELDS, setError));
    }
  });

  if (!tokenValid) {
    return <LinkProblem message={t('reset.incomplete')} />;
  }
  if (expired) {
    return <LinkProblem message={t('reset.expired')} />;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <FormError>{formError}</FormError> : null}
      <PasswordField
        label={t('reset.newPassword')}
        autoComplete="new-password"
        hint={t('reset.hint', { min: PASSWORD_MIN_LENGTH })}
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" loading={isSubmitting}>
        {t('reset.submit')}
      </Button>
    </form>
  );
}
