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
import { useTranslation } from 'react-i18next';

const ACCOUNT_KEY = ['account'] as const;

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
  const { t } = useTranslation('account');
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
      toast.success(t('name.saved'));
      onOpenChange(false);
    } catch (error) {
      setFormError(formErrorMessage(error));
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title={t('name.title')}
      description={t('name.description')}
      submitLabel={t('name.save')}
      pending={isSubmitting}
      error={formError}
      dirty={isDirty}
      onSubmit={(event) => void submit(event)}
    >
      <FormField
        label={t('name.label')}
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
  const { t } = useTranslation('account');
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
      toast.success(t('password.changed'));
      close(false);
    } catch (error) {
      if (isWrongPassword(error)) {
        setError('currentPassword', { message: t('password.wrongCurrent') });
      } else {
        setFormError(formErrorMessage(error));
      }
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title={t('password.title')}
      description={t('password.description')}
      submitLabel={t('password.title')}
      pending={isSubmitting}
      error={formError}
      dirty={isDirty}
      onSubmit={(event) => void submit(event)}
    >
      <PasswordField
        label={t('password.current')}
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <PasswordField
        label={t('password.new')}
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
    </FormDialog>
  );
}

function LogoutAll() {
  const { t } = useTranslation('account');
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
        {t('logoutAll.button')}
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t('logoutAll.title')}
        description={t('logoutAll.description')}
        confirmLabel={t('logoutAll.confirm')}
        cancelLabel={t('logoutAll.cancel')}
        pending={isLeaving}
        error={error}
        onConfirm={() => void confirm()}
      />
    </div>
  );
}

function DeleteAccount({ hasPassword }: { hasPassword: boolean }) {
  const { t } = useTranslation('account');
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
      toast.success(t('delete.done'));
      leaveSession();
    } catch (error) {
      if (isWrongPassword(error)) {
        setError('password', { message: t('delete.wrongPassword') });
      } else {
        setFormError(formErrorMessage(error));
      }
    }
  });

  return (
    <div>
      <Button variant="secondary" className="text-danger" onClick={() => toggle(true)}>
        {t('delete.button')}
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={toggle}
        title={t('delete.title')}
        description={t('delete.description')}
        confirmLabel={t('delete.confirm')}
        cancelLabel={t('delete.cancel')}
        pending={isSubmitting}
        error={formError}
        onConfirm={() => void submit()}
      >
        {hasPassword ? (
          <PasswordField
            label={t('delete.passwordLabel')}
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
  const { t } = useTranslation(['account', 'common']);
  const account = useQuery({ queryKey: ACCOUNT_KEY, queryFn: getAccount });
  const [editing, setEditing] = useState<'name' | 'password' | null>(null);

  if (account.isPending) {
    return (
      <LoadingState label={t('loading')}>
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
        title={t('failed')}
        description={t('checkNetwork')}
        onRetry={() => void account.refetch()}
      />
    );
  }

  const { email, role, hasPassword, displayName } = account.data;
  const initial = displayName.trim().charAt(0).toLocaleUpperCase('vi') || '?';

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
      <aside
        aria-label={t('profile')}
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
          {t(`common:roles.${role}`)}
        </span>
      </aside>
      <div className="flex min-w-0 flex-col gap-6">
        <Section id="profile-heading" title={t('profile')}>
          <SettingRow
            label={t('name.label')}
            value={displayName}
            action={
              <Button variant="secondary" onClick={() => setEditing('name')}>
                {t('editName')}
              </Button>
            }
          />
          <SettingRow label="Email" value={email} />
        </Section>
        <Section id="security-heading" title={t('security')}>
          <SettingRow
            label={t('passwordRow')}
            value={hasPassword ? '••••••••' : t('googleOnly')}
            action={
              hasPassword ? (
                <Button variant="secondary" onClick={() => setEditing('password')}>
                  {t('password.title')}
                </Button>
              ) : undefined
            }
          />
          <SettingRow label={t('sessions')} value={t('sessionsHint')} action={<LogoutAll />} />
        </Section>
        {children}
        <Section
          id="delete-heading"
          title={t('delete.button')}
          tone="danger"
          description={t('delete.sectionDescription')}
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
