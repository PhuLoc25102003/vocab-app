'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_USER_SORTS,
  adminUserQuerySchema,
  lockUserSchema,
  roleSchema,
  type AdminUser,
  type AdminUserSort,
  type LockUserDto,
  type Role,
} from '@vocab/shared';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { FormDialog } from '@/components/common/form-dialog';
import { TextareaField } from '@/components/common/form-field';
import {
  ListFilter,
  ListNoMatch,
  ListPager,
  ListPanel,
  ListToolbar,
} from '@/components/common/list-panel';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { HttpError } from '@/lib/http';
import { cn } from '@/lib/utils';
import {
  adminKeys,
  ADMIN_USERS_PAGE_SIZE,
  listAdminUsers,
  lockUser,
  setUserRole,
  unlockUser,
  type AdminUsersView,
} from '../api';

const STATUS_TABS = [undefined, 'active', 'locked'] as const;

const isSort = (value: string | null): value is AdminUserSort =>
  ADMIN_USER_SORTS.some((sort) => sort === value);

function usersHref(view: AdminUsersView): Route {
  const params = new URLSearchParams();
  if (view.q) params.set('q', view.q);
  if (view.role) params.set('role', view.role);
  if (view.status) params.set('status', view.status);
  if (view.sort !== '-createdAt') params.set('sort', view.sort);
  if (view.page > 1) params.set('page', String(view.page));
  const query = params.toString();
  return (query ? `/admin/users?${query}` : '/admin/users') as Route;
}

/** Đọc bộ lọc từ URL; giá trị sai thì bỏ qua, không báo lỗi. */
function readView(params: URLSearchParams): AdminUsersView {
  const { shape } = adminUserQuerySchema;
  const q = shape.q.safeParse(params.get('q') ?? undefined);
  const role = shape.role.safeParse(params.get('role') ?? undefined);
  const status = shape.status.safeParse(params.get('status') ?? undefined);
  const page = shape.page.safeParse(params.get('page') ?? undefined);
  const sort = params.get('sort');
  return {
    q: q.success ? (q.data ?? '') : '',
    role: role.success ? role.data : undefined,
    status: status.success ? status.data : undefined,
    sort: isSort(sort) ? sort : '-createdAt',
    page: page.success ? page.data : 1,
  };
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
  const initial = user.displayName.trim().charAt(0).toLocaleUpperCase('vi') || '?';
  const locked = user.lockedAt !== null;

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border py-3 last:border-b-0 sm:px-2">
      <span
        aria-hidden
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-full font-semibold',
          locked ? 'bg-danger-soft text-danger' : 'bg-primary-soft text-primary',
        )}
      >
        {initial}
      </span>
      <div className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
        <p className="font-semibold wrap-anywhere">{user.displayName}</p>
        <p className="text-small break-all text-text-muted">{user.email}</p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-sm px-2 font-medium',
              locked ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success',
            )}
          >
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            {locked ? t('locked') : t('active')}
          </span>
          {locked && user.lockReason ? (
            <span className="text-text-muted wrap-anywhere">
              {t('lockedReason', { reason: user.lockReason })}
            </span>
          ) : null}
        </p>
      </div>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <div className="min-w-0 flex-1 sm:w-40 sm:flex-none">
          <Select
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
          </Select>
        </div>
        {/* Không khoá tài khoản quản trị từ đây, nên ADMIN cũng không tự khoá mình. Giữ chỗ để các cột thẳng hàng. */}
        <div className="w-28 shrink-0">
          {user.role === 'ADMIN' ? null : locked ? (
            <Button
              variant="secondary"
              className="w-full"
              loading={unlock.isPending}
              aria-label={t('unlockLabel', { email: user.email })}
              onClick={() => unlock.mutate()}
            >
              {t('unlock')}
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="w-full"
              aria-label={t('lockLabel', { email: user.email })}
              onClick={() => setLocking(true)}
            >
              {t('lock.button')}
            </Button>
          )}
        </div>
      </div>
      <LockDialog user={user} open={locking && !locked} onOpenChange={setLocking} />
    </li>
  );
}

export function AdminUsersLoading() {
  const { t } = useTranslation('admin');
  return (
    <LoadingState label={t('users.loading')}>
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </LoadingState>
  );
}

export function AdminUsers() {
  const { t } = useTranslation('admin');
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = readView(new URLSearchParams(searchParams.toString()));
  const go = (patch: Partial<AdminUsersView>) =>
    router.push(usersHref({ ...view, page: 1, ...patch }));
  const users = useQuery({
    queryKey: adminKeys.userList(view),
    queryFn: () => listAdminUsers(view),
  });

  if (users.isError && users.error instanceof HttpError && users.error.status === 403) {
    return <EmptyState title={t('users.forbidden')} description={t('users.forbiddenHint')} />;
  }

  const filtered = Boolean(view.q || view.role || view.status);
  let body;
  if (users.isPending) {
    body = <AdminUsersLoading />;
  } else if (users.isError) {
    body = (
      <ErrorState
        title={t('users.failed')}
        description={t('checkNetwork')}
        onRetry={() => void users.refetch()}
      />
    );
  } else if (users.data.data.length === 0) {
    body = filtered ? (
      <ListNoMatch
        text={view.q ? t('users.noMatch', { q: view.q }) : t('users.noFilterMatch')}
        clearHref={usersHref({ q: '', sort: view.sort, page: 1 })}
      />
    ) : (
      <EmptyState title={t('users.notFound')} description={t('users.empty')} />
    );
  } else {
    body = (
      <ul aria-label={t('users.list')} className="flex flex-col">
        {users.data.data.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </ul>
    );
  }

  return (
    <ListPanel
      title={t('users.list')}
      count={users.data?.meta.total}
      toolbar={
        <ListToolbar
          key={view.q}
          tabs={STATUS_TABS.map((status) => ({
            label: t(`users.status.${status ?? 'all'}`),
            href: usersHref({ ...view, status, page: 1 }),
            current: view.status === status,
          }))}
          search={{ label: t('users.search'), value: view.q, onSearch: (q) => go({ q }) }}
          filters={
            <>
              <ListFilter>
                <Select
                  aria-label={t('users.roleFilter')}
                  value={view.role ?? ''}
                  onChange={(event) => {
                    const role = roleSchema.safeParse(event.target.value);
                    go({ role: role.success ? role.data : undefined });
                  }}
                >
                  <option value="">{t('users.allRoles')}</option>
                  {roleSchema.options.map((role) => (
                    <option key={role} value={role}>
                      {t(`roles.${role}`)}
                    </option>
                  ))}
                </Select>
              </ListFilter>
              <ListFilter>
                <Select
                  aria-label={t('users.sort')}
                  value={view.sort}
                  onChange={(event) => {
                    if (isSort(event.target.value)) go({ sort: event.target.value });
                  }}
                >
                  {ADMIN_USER_SORTS.map((sort) => (
                    <option key={sort} value={sort}>
                      {t(`users.sorts.${sort}`)}
                    </option>
                  ))}
                </Select>
              </ListFilter>
            </>
          }
        />
      }
      footer={
        users.data && users.data.meta.total > 0 ? (
          <ListPager
            page={users.data.meta.page}
            pageSize={ADMIN_USERS_PAGE_SIZE}
            total={users.data.meta.total}
            hrefFor={(page) => usersHref({ ...view, page })}
          />
        ) : null
      }
    >
      {body}
    </ListPanel>
  );
}
