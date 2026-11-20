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

const passwordSchema = resetPasswordSchema.pick({ password: true });
type PasswordInput = Pick<ResetPasswordInput, 'password'>;
const FIELDS = ['password'] as const;

function LinkProblem({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-4">
      <FormError>{message}</FormError>
      <Button asChild>
        <Link href="/forgot-password">Gửi liên kết mới</Link>
      </Button>
    </div>
  );
}

export function ResetPasswordForm() {
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
    return (
      <LinkProblem message="Liên kết không đầy đủ. Hãy mở lại liên kết trong thư, hoặc xin liên kết mới." />
    );
  }
  if (expired) {
    return <LinkProblem message="Liên kết đã hết hạn hoặc đã được dùng. Hãy xin liên kết mới." />;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <FormError>{formError}</FormError> : null}
      <PasswordField
        label="Mật khẩu mới"
        autoComplete="new-password"
        hint={`Ít nhất ${PASSWORD_MIN_LENGTH} ký tự. Các thiết bị đang đăng nhập sẽ bị đăng xuất.`}
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" loading={isSubmitting}>
        Đặt mật khẩu mới
      </Button>
    </form>
  );
}
