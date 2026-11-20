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
import { FormDialog } from '@/components/common/form-dialog';
import { FormField } from '@/components/common/form-field';
import { LoadingState } from '@/components/common/loading-state';
import { PasswordField } from '@/components/common/password-field';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { HttpError } from '@/lib/http';
import { cn } from '@/lib/utils';
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
  tone = 'default',
  children,
}: {
  id: string;
  title: string;
  description?: string;
  tone?: 'default' | 'danger';
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        'flex w-full flex-col gap-3 rounded-lg border bg-surface p-4 sm:p-5',
        tone === 'danger' ? 'border-danger-mark' : 'border-border',
      )}
    >
      <div className="flex flex-col gap-1">
        <h2 id={id} className={cn('text-h3', tone === 'danger' && 'text-danger')}>
          {title}
        </h2>
        {description ? <p className="text-small text-text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** Một dòng cài đặt: nhãn, giá trị hiện tại và nút thao tác bên phải. */
function SettingRow({
  label,
  value,
  action,
}: {
  label: string;
  value: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-3 first:border-t-0 first:pt-0">
      <div className="flex min-w-0 flex-1 basis-48 flex-col">
        <span className="text-small text-text-muted">{label}</span>
        <span className="wrap-anywhere">{value}</span>
      </div>
      {action}
    </div>
  );
}

function NameDialog({
  account,
  open,
  onOpenChange,
}: {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ChangeDisplayNameInput>({
    resolver: zodResolver(changeDisplayNameSchema),
    values: { displayName: account.displayName },
  });

  const close = (next: boolean) => {
    if (!next) {
      reset({ displayName: account.displayName });
      setFormError(null);
    }
    onOpenChange(next);
  };

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
      onOpenChange(false);
    } catch (error) {
      setFormError(formErrorMessage(error));
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title="Đổi tên hiển thị"
      description="Tên này hiện cho giáo viên, bạn cùng lớp và trên bộ từ công khai của bạn."
      submitLabel="Lưu tên"
      pending={isSubmitting}
      error={formError}
      dirty={isDirty}
      onSubmit={(event) => void submit(event)}
    >
      <FormField
        label="Tên hiển thị"
        autoComplete="name"
        error={errors.displayName?.message}
        {...register('displayName')}
      />
    </FormDialog>
  );
}

function PasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  // Next giữ trang cũ ẩn trong DOM, không để mật khẩu nằm lại trong form.
  useEffect(() => () => reset(), [reset]);

  const close = (next: boolean) => {
    if (!next) {
      reset();
      setFormError(null);
    }
    onOpenChange(next);
  };

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      startSession(await changePassword(values));
      toast.success('Đã đổi mật khẩu. Các thiết bị khác đã được đăng xuất.');
      close(false);
    } catch (error) {
      if (isWrongPassword(error)) {
        setError('currentPassword', { message: 'Mật khẩu hiện tại không đúng' });
      } else {
        setFormError(formErrorMessage(error));
      }
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title="Đổi mật khẩu"
      description="Sau khi đổi, các thiết bị khác sẽ bị đăng xuất."
      submitLabel="Đổi mật khẩu"
      pending={isSubmitting}
      error={formError}
      dirty={isDirty}
      onSubmit={(event) => void submit(event)}
    >
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
    </FormDialog>
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

/** `children`: phần cài đặt thêm do trang ghép vào cột phải, ví dụ giọng đọc. */
export function AccountSettings({ children }: { children?: ReactNode }) {
  const account = useQuery({ queryKey: ACCOUNT_KEY, queryFn: getAccount });
  const [editing, setEditing] = useState<'name' | 'password' | null>(null);

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

  const { email, role, hasPassword, displayName } = account.data;
  const initial = displayName.trim().charAt(0).toLocaleUpperCase('vi') || '?';

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
      <aside
        aria-label="Hồ sơ"
        className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-5 text-center lg:sticky lg:top-6"
      >
        <span
          aria-hidden
          className="flex size-16 items-center justify-center rounded-full bg-primary text-h2 font-semibold text-primary-fg"
        >
          {initial}
        </span>
        <p className="text-h3 wrap-anywhere">{displayName}</p>
        <p className="text-small wrap-anywhere text-text-muted">{email}</p>
        <span className="rounded-sm bg-primary-soft px-2 text-tiny text-primary">
          {ROLE_LABELS[role]}
        </span>
      </aside>
      <div className="flex min-w-0 flex-col gap-6">
        <Section id="profile-heading" title="Hồ sơ">
          <SettingRow
            label="Tên hiển thị"
            value={displayName}
            action={
              <Button variant="secondary" onClick={() => setEditing('name')}>
                Sửa tên
              </Button>
            }
          />
          <SettingRow label="Email" value={email} />
        </Section>
        <Section id="security-heading" title="Bảo mật">
          <SettingRow
            label="Mật khẩu"
            value={hasPassword ? '••••••••' : 'Đăng nhập bằng Google'}
            action={
              hasPassword ? (
                <Button variant="secondary" onClick={() => setEditing('password')}>
                  Đổi mật khẩu
                </Button>
              ) : undefined
            }
          />
          <SettingRow
            label="Phiên đăng nhập"
            value="Đăng xuất khỏi mọi thiết bị, dùng khi bạn quên đăng xuất ở máy khác."
            action={<LogoutAll />}
          />
        </Section>
        {children}
        <Section
          id="delete-heading"
          title="Xoá tài khoản"
          tone="danger"
          description="Tài khoản, bộ từ và tiến độ học của bạn sẽ bị xoá hẳn. Tiến độ của người khác trên các bộ từ này cũng mất."
        >
          <DeleteAccount hasPassword={hasPassword} />
        </Section>
      </div>
      <NameDialog
        account={account.data}
        open={editing === 'name'}
        onOpenChange={(open) => setEditing(open ? 'name' : null)}
      />
      {hasPassword ? (
        <PasswordDialog
          open={editing === 'password'}
          onOpenChange={(open) => setEditing(open ? 'password' : null)}
        />
      ) : null}
    </div>
  );
}
