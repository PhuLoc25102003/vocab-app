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
import { FormField, SelectField, TextareaField } from '@/components/common/form-field';
import { FormError } from '@/components/common/form-message';
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

const ROLE_LABELS: Record<AdminUser['role'], string> = {
  STUDENT: 'Học sinh',
  TEACHER: 'Giáo viên',
  ADMIN: 'Quản trị',
};

function usersHref(q: string, page = 1): Route {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return (query ? `/admin/users?${query}` : '/admin/users') as Route;
}

function LockForm({ user, onDone }: { user: AdminUser; onDone: () => void }) {
  const queryClient = useQueryClient();
  const lock = useMutation({ mutationFn: (dto: LockUserDto) => lockUser(user.id, dto.reason) });
  const form = useForm<LockUserDto>({
    resolver: zodResolver(lockUserSchema),
    defaultValues: { reason: '' },
  });
  const submit = form.handleSubmit(async (dto) => {
    try {
      await lock.mutateAsync(dto);
      await queryClient.invalidateQueries({ queryKey: adminKeys.users });
      toast.success(`Đã khoá tài khoản ${user.email}`);
      onDone();
    } catch {
      // Lỗi hiện qua `lock.error`.
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex w-full flex-col gap-3">
      {lock.error ? <FormError>{formErrorMessage(lock.error)}</FormError> : null}
      <TextareaField
        label="Lý do khoá"
        rows={2}
        autoFocus
        error={form.formState.errors.reason?.message}
        {...form.register('reason')}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={lock.isPending}>
          Khoá tài khoản
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Huỷ
        </Button>
      </div>
    </form>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();
  const [locking, setLocking] = useState(false);
  const unlock = useMutation({
    mutationFn: () => unlockUser(user.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.users });
      toast.success(`Đã mở khoá tài khoản ${user.email}`);
    },
    onError: (error) => toast.error(formErrorMessage(error)),
  });
  const changeRole = useMutation({
    mutationFn: (role: Role) => setUserRole(user.id, role),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.users });
      toast.success(`Đã đổi ${updated.email} thành ${ROLE_LABELS[updated.role]}`);
    },
    onError: (error) => toast.error(formErrorMessage(error)),
  });

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border py-3">
      <div className="min-w-0 flex-1 basis-56">
        <p className="text-h3 break-words">{user.displayName}</p>
        <p className="text-small break-all text-text-muted">{user.email}</p>
        <p className="text-small">
          {ROLE_LABELS[user.role]} ·{' '}
          {user.lockedAt ? (
            <span className="text-danger">Đã khoá: {user.lockReason}</span>
          ) : (
            'Đang hoạt động'
          )}
        </p>
      </div>
      <div className="w-40">
        <SelectField
          label="Vai trò"
          aria-label={`Vai trò của ${user.email}`}
          value={user.role}
          disabled={changeRole.isPending}
          onChange={(event) => {
            const role = roleSchema.safeParse(event.target.value);
            if (role.success && role.data !== user.role) changeRole.mutate(role.data);
          }}
        >
          {roleSchema.options.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </SelectField>
      </div>
      {/* Không khoá tài khoản quản trị từ đây, nên ADMIN cũng không tự khoá mình. */}
      {user.role === 'ADMIN' ? null : user.lockedAt ? (
        <Button
          variant="secondary"
          loading={unlock.isPending}
          aria-label={`Mở khoá ${user.email}`}
          onClick={() => unlock.mutate()}
        >
          Mở khoá
        </Button>
      ) : locking ? null : (
        <Button
          variant="secondary"
          aria-label={`Khoá ${user.email}`}
          onClick={() => setLocking(true)}
        >
          Khoá
        </Button>
      )}
      {locking && !user.lockedAt ? <LockForm user={user} onDone={() => setLocking(false)} /> : null}
    </li>
  );
}

export function AdminUsersLoading() {
  return (
    <LoadingState label="Đang tải người dùng">
      <Skeleton className="h-11 max-w-[480px]" />
      <Skeleton className="h-64" />
    </LoadingState>
  );
}

export function AdminUsers() {
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
        <FormField
          key={q}
          name="q"
          label="Tìm theo email hoặc tên"
          defaultValue={q}
          maxLength={100}
        />
      </div>
      <Button type="submit" variant="secondary">
        Tìm
      </Button>
    </form>
  );

  if (users.isPending) {
    return <AdminUsersLoading />;
  }
  if (users.isError) {
    if (users.error instanceof HttpError && users.error.status === 403) {
      return (
        <EmptyState
          title="Bạn không có quyền xem trang này"
          description="Chỉ quản trị viên mới quản lý được người dùng."
        />
      );
    }
    return (
      <ErrorState
        title="Không tải được danh sách người dùng"
        description="Hãy kiểm tra mạng rồi thử lại."
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
          title="Không tìm thấy người dùng"
          description={q ? `Không có ai khớp với “${q}”.` : 'Chưa có người dùng nào.'}
          action={
            q ? (
              <Button variant="secondary" onClick={() => router.push(usersHref(''))}>
                Xem tất cả
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-small text-text-muted tabular-nums">{meta.total} người dùng</p>
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
