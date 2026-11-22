'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ADMIN_USER_SORTS,
  adminUserQuerySchema,
  roleSchema,
  type AdminUser,
  type AdminUserSort,
  type Role,
} from '@vocab/shared';
import { type Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { GraduationCap, Lock, ShieldCheck, Unlock, User } from 'lucide-react';
import { DataTableContainer, DataTableHeader, DataTableRow } from '@/components/common/data-table';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
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
  setUserRole,
  unlockUser,
  type AdminUsersView,
} from '../api';
import { LockDialog } from './lock-dialog';

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

const USER_GRID =
  'minmax(200px, 1.8fr) minmax(130px, 1fr) minmax(120px, 0.9fr) minmax(240px, 1.6fr)';

function RoleBadge({ role }: { role: Role }) {
  const { t } = useTranslation('admin');
  if (role === 'ADMIN') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm bg-primary-soft px-2.5 py-1 text-tiny font-medium text-primary whitespace-nowrap w-fit">
        <ShieldCheck aria-hidden className="size-3.5 shrink-0" />
        {t(`roles.${role}`)}
      </span>
    );
  }
  if (role === 'TEACHER') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm bg-accent/20 px-2.5 py-1 text-tiny font-medium text-accent whitespace-nowrap w-fit">
        <GraduationCap aria-hidden className="size-3.5 shrink-0" />
        {t(`roles.${role}`)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm bg-surface-elevated px-2.5 py-1 text-tiny font-medium text-text-muted whitespace-nowrap w-fit">
      <User aria-hidden className="size-3.5 shrink-0" />
      {t(`roles.${role}`)}
    </span>
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
    <DataTableRow gridTemplateColumns={USER_GRID}>
      {/* Cột 1: Người dùng (Avatar + Tên + Email) */}
      <div className="flex items-center gap-3 min-w-0">
        <span
          aria-hidden
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full font-semibold',
            locked ? 'bg-danger-soft text-danger' : 'bg-primary-soft text-primary',
          )}
        >
          {initial}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="font-semibold text-text truncate block" title={user.displayName}>
            {user.displayName}
          </p>
          <p className="text-small text-text-muted truncate block" title={user.email}>
            {user.email}
          </p>
        </div>
      </div>

      {/* Cột 2: Trạng thái */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-tiny font-medium w-fit whitespace-nowrap',
            locked ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success',
          )}
        >
          <span aria-hidden className="size-1.5 rounded-full bg-current" />
          {locked ? t('locked') : t('active')}
        </span>
        {locked && user.lockReason ? (
          <span className="text-tiny text-danger truncate block" title={user.lockReason}>
            {t('lockedReason', { reason: user.lockReason })}
          </span>
        ) : null}
      </div>

      {/* Cột 3: Vai trò (Badge trực quan) */}
      <div className="min-w-0">
        <RoleBadge role={user.role} />
      </div>

      {/* Cột 4: Thao tác (Đổi vai trò + Khoá / Mở khoá, căn phải) */}
      <div className="flex items-center justify-end gap-2">
        <div className="w-32 sm:w-36 shrink-0">
          <Select
            aria-label={t('roleOf', { email: user.email })}
            value={user.role}
            disabled={changeRole.isPending}
            className="h-9 text-small w-full"
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

        {user.role === 'ADMIN' ? (
          <div className="w-24 shrink-0" />
        ) : locked ? (
          <Button
            variant="secondary"
            className="w-24 gap-1.5 text-small whitespace-nowrap h-9 px-3 shrink-0"
            loading={unlock.isPending}
            aria-label={t('unlockLabel', { email: user.email })}
            onClick={() => unlock.mutate()}
          >
            <Unlock aria-hidden className="size-4 shrink-0 text-success" />
            {t('unlock')}
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="w-24 gap-1.5 text-small whitespace-nowrap h-9 px-3 shrink-0"
            aria-label={t('lockLabel', { email: user.email })}
            onClick={() => setLocking(true)}
          >
            <Lock aria-hidden className="size-4 shrink-0 text-danger" />
            {t('lock.button')}
          </Button>
        )}
      </div>
      <LockDialog user={user} open={locking && !locked} onOpenChange={setLocking} />
    </DataTableRow>
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
      <DataTableContainer minWidth="min-w-[720px]">
        <DataTableHeader
          gridTemplateColumns={USER_GRID}
          columns={[
            { label: t('users.thUser') },
            { label: t('users.thStatus') },
            { label: t('users.thRole') },
            { label: t('users.thAction'), align: 'right' },
          ]}
        />
        <ul aria-label={t('users.list')} className="flex flex-col">
          {users.data.data.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </ul>
      </DataTableContainer>
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
