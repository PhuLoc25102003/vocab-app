'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  lockUserSchema,
  paginationSchema,
  roleSchema,
  type AdminUser,
  type LockUserDto,
  type Role,
} from '@vocab/shared';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { FormDialog } from '@/components/common/form-dialog';
import { FormField, SelectField, TextareaField } from '@/components/common/form-field';
import { LoadingState } from '@/components/common/loading-state';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { HttpError } from '@/lib/http';
import {
  adminKeys,
  ADMIN_USERS_PAGE_SIZE,
  listAdminUsers,
  lockUser,
  setUserRole,
  unlockUser,
} from '../api';
import { useTranslation } from 'react-i18next';

function usersHref(q: string, page = 1): Route {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return (query ? `/admin/users?${query}` : '/admin/users') as Route;
}

function LockDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const lock = useMutation({ mutationFn: (dto: LockUserDto) => lockUser(user.id, dto.reason) });
  const form = useForm<LockUserDto>({
    resolver: zodResolver(lockUserSchema),
    defaultValues: { reason: '' },
  });
  const close = (next: boolean) => {
    if (!next) {
      form.reset();
      lock.reset();
    }
    onOpenChange(next);
  };
  const submit = form.handleSubmit(async (dto) => {
    try {
      await lock.mutateAsync(dto);
      await queryClient.invalidateQueries({ queryKey: adminKeys.users });
      toast.success(t('lock.done', { email: user.email }));
      close(false);
    } catch {
      // Lỗi hiện qua `lock.error`.
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title={t('lock.title', { email: user.email })}
      description={t('lock.description')}
      submitLabel={t('lock.submit')}
      pending={lock.isPending}
      error={lock.error ? formErrorMessage(lock.error) : null}
      dirty={form.formState.isDirty}
      onSubmit={(event) => void submit(event)}
    >
      <TextareaField
        label={t('lock.reason')}
        rows={2}
        error={form.formState.errors.reason?.message}
        {...form.register('reason')}
      />
    </FormDialog>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const [locking, setLocking] = useState(false);
  const unlock = useMutation({
    mutationFn: () => unlockUser(user.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.users });
      toast.success(t('unlocked', { email: user.email }));
    },
    onError: (error) => toast.error(formErrorMessage(error)),
  });
  const changeRole = useMutation({
    mutationFn: (role: Role) => setUserRole(user.id, role),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.users });
      toast.success(t('roleChanged', { email: updated.email, role: t(`roles.${updated.role}`) }));
    },
    onError: (error) => toast.error(formErrorMessage(error)),
  });

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border py-3">
      <div className="min-w-0 flex-1 basis-56">
        <p className="text-h3 break-words">{user.displayName}</p>
        <p className="text-small break-all text-text-muted">{user.email}</p>
        <p className="text-small">
          {t(`roles.${user.role}`)} ·{' '}
          {user.lockedAt ? (
            <span className="text-danger">{t('lockedReason', { reason: user.lockReason })}</span>
          ) : (
            t('active')
          )}
        </p>
      </div>
      <div className="w-40">
        <SelectField
          label={t('role')}
          aria-label={t('roleOf', { email: user.email })}
          value={user.role}
          disabled={changeRole.isPending}
          onChange={(event) => {
            const role = roleSchema.safeParse(event.target.value);
            if (role.success && role.data !== user.role) changeRole.mutate(role.data);
          }}
        >
          {roleSchema.options.map((role) => (
            <option key={role} value={role}>
              {t(`roles.${role}`)}
            </option>
          ))}
        </SelectField>
      </div>
      {/* Không khoá tài khoản quản trị từ đây, nên ADMIN cũng không tự khoá mình. */}
      {user.role === 'ADMIN' ? null : user.lockedAt ? (
        <Button
          variant="secondary"
          loading={unlock.isPending}
          aria-label={t('unlockLabel', { email: user.email })}
          onClick={() => unlock.mutate()}
        >
          {t('unlock')}
        </Button>
      ) : (
        <Button
          variant="secondary"
          aria-label={t('lockLabel', { email: user.email })}
          onClick={() => setLocking(true)}
        >
          {t('lock.button')}
        </Button>
      )}
      <LockDialog user={user} open={locking && !user.lockedAt} onOpenChange={setLocking} />
    </li>
  );
}

export function AdminUsersLoading() {
  const { t } = useTranslation('admin');
  return (
    <LoadingState label={t('users.loading')}>
      <Skeleton className="h-11 max-w-[480px]" />
      <Skeleton className="h-64" />
    </LoadingState>
  );
}

export function AdminUsers() {
  const { t } = useTranslation('admin');
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = (searchParams.get('q') ?? '').trim().slice(0, 100);
  const parsedPage = paginationSchema.shape.page.safeParse(searchParams.get('page'));
  const page = parsedPage.success ? parsedPage.data : 1;
  const users = useQuery({
    queryKey: adminKeys.userList(page, q),
    queryFn: () => listAdminUsers(page, q),
  });

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('q');
    router.push(usersHref(typeof value === 'string' ? value.trim() : ''));
  };

  const searchForm = (
    <form role="search" onSubmit={search} className="flex max-w-[480px] items-end gap-2">
      <div className="flex-1">
        <FormField key={q} name="q" label={t('users.search')} defaultValue={q} maxLength={100} />
      </div>
      <Button type="submit" variant="secondary">
        {t('users.searchSubmit')}
      </Button>
    </form>
  );

  if (users.isPending) {
    return <AdminUsersLoading />;
  }
  if (users.isError) {
    if (users.error instanceof HttpError && users.error.status === 403) {
      return <EmptyState title={t('users.forbidden')} description={t('users.forbiddenHint')} />;
    }
    return (
      <ErrorState
        title={t('users.failed')}
        description={t('checkNetwork')}
        onRetry={() => void users.refetch()}
      />
    );
  }

  const { data, meta } = users.data;
  return (
    <div className="flex flex-col gap-6">
      {searchForm}
      {data.length === 0 ? (
        <EmptyState
          title={t('users.notFound')}
          description={q ? t('users.noMatch', { q }) : t('users.empty')}
          action={
            q ? (
              <Button variant="secondary" onClick={() => router.push(usersHref(''))}>
                {t('users.seeAll')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-small text-text-muted tabular-nums">
            {t('users.count', { count: meta.total })}
          </p>
          <ul className="border-t border-border">
            {data.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </ul>
          <Pagination
            page={meta.page}
            pageCount={Math.ceil(meta.total / ADMIN_USERS_PAGE_SIZE)}
            hrefFor={(next) => usersHref(q, next)}
          />
        </>
      )}
    </div>
  );
}
