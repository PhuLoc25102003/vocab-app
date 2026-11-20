'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  changeDisplayNameSchema,
  changePasswordSchema,
  confirmPasswordSchema,
  ERROR_CODES,
  type Account,
  type ChangeDisplayNameInput,
  type ChangePasswordInput,
  type ConfirmPasswordInput,
  type Role,
} from '@vocab/shared';
import { useEffect, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ErrorState } from '@/components/common/error-state';
import { FormField } from '@/components/common/form-field';
import { FormError } from '@/components/common/form-message';
import { LoadingState } from '@/components/common/loading-state';
import { PasswordField } from '@/components/common/password-field';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { HttpError } from '@/lib/http';
import { changeDisplayName, changePassword, deleteAccount, getAccount, logoutAll } from '../api';
import { leaveSession, startSession } from '../session';
import { useAuthStore } from '../store';

const ACCOUNT_KEY = ['account'] as const;
const ROLE_LABELS: Record<Role, string> = {
  STUDENT: 'Học sinh',
  TEACHER: 'Giáo viên',
  ADMIN: 'Quản trị viên',
};

const isWrongPassword = (error: unknown) =>
  error instanceof HttpError && error.code === ERROR_CODES.WRONG_PASSWORD;

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex w-full flex-col gap-3 border-t border-border pt-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-h3">
          {title}
        </h2>
        {description ? <p className="text-small text-text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ProfileForm({ account }: { account: Account }) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangeDisplayNameInput>({
    resolver: zodResolver(changeDisplayNameSchema),
    defaultValues: { displayName: account.displayName },
  });

  const submit = handleSubmit(async ({ displayName }) => {
    setFormError(null);
    try {
      const { user } = await changeDisplayName(displayName);
      const { accessToken } = useAuthStore.getState();
      if (accessToken) {
        startSession({ user, accessToken });
      }
      queryClient.setQueryData<Account>(ACCOUNT_KEY, { ...account, ...user });
      reset({ displayName: user.displayName });
      toast.success('Đã lưu tên hiển thị');
    } catch (error) {
      setFormError(formErrorMessage(error));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col items-start gap-3">
      {formError ? <FormError>{formError}</FormError> : null}
      <FormField
        label="Tên hiển thị"
        autoComplete="name"
        className="w-full"
        error={errors.displayName?.message}
        {...register('displayName')}
      />
      <Button type="submit" variant="secondary" loading={isSubmitting}>
        Lưu tên
      </Button>
    </form>
  );
}

function PasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  // Next giữ trang cũ ẩn trong DOM, không để mật khẩu nằm lại trong form.
  useEffect(() => () => reset(), [reset]);

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      startSession(await changePassword(values));
      reset();
      toast.success('Đã đổi mật khẩu. Các thiết bị khác đã được đăng xuất.');
    } catch (error) {
      if (isWrongPassword(error)) {
        setError('currentPassword', { message: 'Mật khẩu hiện tại không đúng' });
      } else {
        setFormError(formErrorMessage(error));
      }
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col items-start gap-3">
      {formError ? <FormError>{formError}</FormError> : null}
      <PasswordField
        label="Mật khẩu hiện tại"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <PasswordField
        label="Mật khẩu mới"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <Button type="submit" variant="secondary" loading={isSubmitting}>
        Đổi mật khẩu
      </Button>
    </form>
  );
}

function LogoutAll() {
  const [confirming, setConfirming] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setIsLeaving(true);
    setError(null);
    try {
      await logoutAll();
      leaveSession();
    } catch (reason) {
      setIsLeaving(false);
      setError(formErrorMessage(reason));
    }
  };

  return (
    <div>
      <Button
        variant="secondary"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
      >
        Đăng xuất mọi thiết bị
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Đăng xuất mọi thiết bị?"
        description="Bạn sẽ phải đăng nhập lại trên mọi thiết bị, kể cả thiết bị này."
        confirmLabel="Đăng xuất tất cả"
        cancelLabel="Giữ đăng nhập"
        pending={isLeaving}
        error={error}
        onConfirm={() => void confirm()}
      />
    </div>
  );
}

function DeleteAccount({ hasPassword }: { hasPassword: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmPasswordInput>({
    resolver: hasPassword ? zodResolver(confirmPasswordSchema) : undefined,
    defaultValues: { password: '' },
  });

  useEffect(() => () => reset(), [reset]);

  // Đóng hay mở đều xoá mật khẩu đã nhập, không để nó nằm lại trong DOM.
  const toggle = (next: boolean) => {
    setConfirming(next);
    setFormError(null);
    reset();
  };

  const submit = handleSubmit(async ({ password }) => {
    setFormError(null);
    try {
      await deleteAccount(hasPassword ? password : undefined);
      toast.success('Đã xoá tài khoản');
      leaveSession();
    } catch (error) {
      if (isWrongPassword(error)) {
        setError('password', { message: 'Mật khẩu không đúng' });
      } else {
        setFormError(formErrorMessage(error));
      }
    }
  });

  return (
    <div>
      <Button variant="secondary" className="text-danger" onClick={() => toggle(true)}>
        Xoá tài khoản
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={toggle}
        title="Xoá tài khoản?"
        description="Mọi bộ từ, tiến độ học và phiên đăng nhập của bạn sẽ bị xoá. Việc này không thể hoàn tác."
        confirmLabel="Xoá vĩnh viễn"
        cancelLabel="Giữ tài khoản"
        pending={isSubmitting}
        error={formError}
        onConfirm={() => void submit()}
      >
        {hasPassword ? (
          <PasswordField
            label="Nhập mật khẩu để xác nhận"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
        ) : null}
      </ConfirmDialog>
    </div>
  );
}

export function AccountSettings() {
  const account = useQuery({ queryKey: ACCOUNT_KEY, queryFn: getAccount });

  if (account.isPending) {
    return (
      <LoadingState label="Đang tải tài khoản">
        <div className="flex w-full flex-col gap-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </LoadingState>
    );
  }
  if (account.isError) {
    return (
      <ErrorState
        title="Không tải được tài khoản"
        description="Hãy kiểm tra mạng rồi thử lại."
        onRetry={() => void account.refetch()}
      />
    );
  }

  const { email, role, hasPassword } = account.data;

  return (
    <div className="flex flex-col gap-6">
      <dl className="flex flex-wrap gap-x-10 gap-y-3">
        <div className="flex min-w-0 flex-col">
          <dt className="text-small text-text-muted">Email</dt>
          <dd className="break-words">{email}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-small text-text-muted">Vai trò</dt>
          <dd>{ROLE_LABELS[role]}</dd>
        </div>
      </dl>
      <Section id="profile-heading" title="Thông tin cá nhân">
        <ProfileForm account={account.data} />
      </Section>
      {hasPassword ? (
        <Section
          id="password-heading"
          title="Mật khẩu"
          description="Sau khi đổi, các thiết bị khác sẽ bị đăng xuất."
        >
          <PasswordForm />
        </Section>
      ) : null}
      <Section
        id="sessions-heading"
        title="Phiên đăng nhập"
        description="Dùng khi bạn quên đăng xuất trên một thiết bị khác."
      >
        <LogoutAll />
      </Section>
      <Section
        id="delete-heading"
        title="Xoá tài khoản"
        description="Tài khoản, bộ từ và tiến độ học của bạn sẽ bị xoá hẳn. Tiến độ của người khác trên các bộ từ này cũng mất."
      >
        <DeleteAccount hasPassword={hasPassword} />
      </Section>
    </div>
  );
}
