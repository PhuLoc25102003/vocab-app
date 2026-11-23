'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignmentListQuerySchema,
  CLASS_MEMBER_SEARCH_MAX_LENGTH,
  classMemberListQuerySchema,
  LIST_SEARCH_MAX_LENGTH,
  createClassSchema,
  paginationSchema,
  type Class,
  type CreateClassInput,
  type UpdateClassInput,
} from '@vocab/shared';
import {
  Archive,
  ArchiveRestore,
  Copy,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  UserPlus,
  X,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getI18n } from 'react-i18next';
import { toast } from 'sonner';
import { BackLink } from '@/components/common/back-link';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { FormDialog } from '@/components/common/form-dialog';
import { FormField, TextareaField } from '@/components/common/form-field';
import { JoinCodeBadge } from './join-code-badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/menu';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { HttpError } from '@/lib/http';
import { classKeys, getClass, regenerateJoinCode, updateClass } from '../api';
import { formatDate } from '../format';
import { type AssignmentsView, ClassAssignments } from './class-assignments';
import { ClassMembers } from './class-members';
import { useTranslation } from 'react-i18next';

function useClassMutation<T>(mutationFn: (value: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classKeys.all }),
  });
}

async function copyCode(code: string) {
  const t = getI18n().getFixedT(null, 'classes');
  try {
    await navigator.clipboard.writeText(code);
    toast.success(t('copy.done', { code }));
  } catch {
    toast.error(t('detail.copyFailed'));
  }
}

/** Mã lớn để chiếu lên bảng, sao chép và đổi mã (việc 5.16b). */
function InviteDialog({
  klass,
  open,
  onOpenChange,
  onRegenerate,
}: {
  klass: Class;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegenerate: () => void;
}) {
  const { t } = useTranslation(['classes', 'common']);
  const titleId = useId();
  return (
    <Dialog
      open={open}
      onRequestClose={() => onOpenChange(false)}
      labelledBy={titleId}
      layout="sheet"
    >
      <div className="flex flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-h3">
            {t('detail.inviteTitle', { name: klass.name })}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('common:actions.close')}
            className="-mt-2 -mr-3 shrink-0"
            onClick={() => onOpenChange(false)}
          >
            <X aria-hidden className="size-5" />
          </Button>
        </div>
        <p className="text-text-muted">
          {klass.archivedAt ? t('detail.inviteArchived') : t('detail.inviteHint')}
        </p>
        <p className="rounded-md bg-primary-soft py-6 text-center font-mono text-card tracking-[0.25em] text-primary">
          {klass.joinCode}
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onRegenerate}>
            <RefreshCw aria-hidden className="size-4" />
            {t('detail.regenerate')}
          </Button>
          <Button onClick={() => void copyCode(klass.joinCode)}>
            <Copy aria-hidden className="size-4" />
            {t('detail.copy')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

type EditClassForm = { name: string; description?: string };

function EditClassDialog({
  klass,
  open,
  onOpenChange,
}: {
  klass: Class;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('classes');
  const update = useClassMutation((dto: UpdateClassInput) => updateClass(klass.id, dto));
  const form = useForm<EditClassForm, unknown, CreateClassInput>({
    resolver: zodResolver(createClassSchema),
    values: { name: klass.name, description: klass.description ?? '' },
  });
  const close = (next: boolean) => {
    if (!next) {
      form.reset();
      update.reset();
    }
    onOpenChange(next);
  };
  const submit = form.handleSubmit((dto) =>
    update.mutate(
      // Mô tả trống thành `null` sau schema; API nhận chuỗi rỗng để xoá mô tả.
      { name: dto.name, description: dto.description ?? '' },
      {
        onSuccess: () => {
          toast.success(t('detail.saved'));
          close(false);
        },
      },
    ),
  );
  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title={t('detail.editTitle')}
      submitLabel={t('detail.save')}
      pending={update.isPending}
      error={update.error ? formErrorMessage(update.error) : null}
      dirty={form.formState.isDirty}
      onSubmit={(event) => void submit(event)}
    >
      <FormField
        label={t('teacher.name')}
        error={form.formState.errors.name?.message}
        {...form.register('name')}
      />
      <TextareaField
        label={t('teacher.description')}
        rows={2}
        error={form.formState.errors.description?.message}
        {...form.register('description')}
      />
    </FormDialog>
  );
}

type Dialogs = 'invite' | 'edit' | 'regenerate' | 'archive' | null;

/** Tiêu đề lớp: tên, dòng thông tin có chip mã, nút "Mời học sinh" và menu "⋯". */
function ClassHeader({ klass }: { klass: Class }) {
  const { t } = useTranslation('classes');
  const [dialog, setDialog] = useState<Dialogs>(null);
  const regenerate = useClassMutation(() => regenerateJoinCode(klass.id));
  const archive = useClassMutation((value: boolean) => updateClass(klass.id, { archived: value }));
  const archived = klass.archivedAt !== null;
  // Mở hộp thoại sau khi menu đóng để focus không bị menu trả về nút "⋯".
  const openLater = (next: Dialogs) => () => setTimeout(() => setDialog(next));

  return (
    <header className="flex flex-col gap-3 rounded-lg border border-border-strong/70 bg-surface/80 px-4 py-2.5 sm:px-5 sm:py-3.5 shadow-sm shadow-primary/5 backdrop-blur-md">
      <div className="flex min-h-[44px] flex-wrap items-center justify-between gap-3">
        <div className="flex max-w-[65ch] min-w-0 flex-col gap-0.5">
          <h1 className="text-[1.65rem] font-bold text-text wrap-anywhere tracking-tight leading-tight sm:text-[1.85rem]">
            {klass.name}
          </h1>
          {klass.description ? (
            <p className="wrap-anywhere text-small text-text-muted">{klass.description}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="secondary" onClick={() => setDialog('invite')}>
            <UserPlus aria-hidden className="size-4" />
            {t('detail.invite')}
          </Button>
          <Menu>
            <MenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('detail.actionsFor', { name: klass.name })}
              >
                <MoreHorizontal aria-hidden className="size-5" />
              </Button>
            </MenuTrigger>
            <MenuContent>
              <MenuItem onSelect={openLater('edit')}>
                <Pencil aria-hidden className="size-4" />
                {t('detail.edit')}
              </MenuItem>
              <MenuItem onSelect={openLater('regenerate')}>
                <RefreshCw aria-hidden className="size-4" />
                {t('detail.regenerateCode')}
              </MenuItem>
              <MenuSeparator />
              {archived ? (
                <MenuItem
                  onSelect={() =>
                    archive.mutate(false, {
                      onSuccess: () => toast.success(t('detail.reopened')),
                      onError: (error) => toast.error(formErrorMessage(error)),
                    })
                  }
                >
                  <ArchiveRestore aria-hidden className="size-4" />
                  {t('detail.reopen')}
                </MenuItem>
              ) : (
                <MenuItem danger onSelect={openLater('archive')}>
                  <Archive aria-hidden className="size-4" />
                  {t('detail.archive')}
                </MenuItem>
              )}
            </MenuContent>
          </Menu>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-2.5 text-small text-text-muted">
        <span className="tabular-nums font-medium text-text">
          {t('detail.members', { count: klass.memberCount })}
        </span>
        <span aria-hidden>·</span>
        <JoinCodeBadge code={klass.joinCode} />
        {archived ? (
          <>
            <span aria-hidden>·</span>
            <span className="font-medium text-danger">
              {t('detail.archivedOn', { date: formatDate(klass.archivedAt ?? '') })}
            </span>
          </>
        ) : null}
      </div>

      <InviteDialog
        klass={klass}
        open={dialog === 'invite'}
        onOpenChange={(open) => setDialog(open ? 'invite' : null)}
        onRegenerate={() => setDialog('regenerate')}
      />
      <EditClassDialog
        klass={klass}
        open={dialog === 'edit'}
        onOpenChange={(open) => setDialog(open ? 'edit' : null)}
      />
      <ConfirmDialog
        open={dialog === 'regenerate'}
        onOpenChange={(open) => setDialog(open ? 'regenerate' : null)}
        title={t('detail.regenerateTitle')}
        description={t('detail.regenerateDescription')}
        confirmLabel={t('detail.regenerate')}
        pending={regenerate.isPending}
        error={regenerate.error ? formErrorMessage(regenerate.error) : null}
        onConfirm={() =>
          regenerate.mutate(undefined, {
            onSuccess: () => {
              setDialog('invite');
              toast.success(t('detail.regenerated'));
            },
          })
        }
      />
      <ConfirmDialog
        open={dialog === 'archive'}
        onOpenChange={(open) => setDialog(open ? 'archive' : null)}
        title={t('detail.archiveTitle', { name: klass.name })}
        description={t('detail.archiveDescription')}
        confirmLabel={t('detail.archiveConfirm')}
        pending={archive.isPending}
        error={archive.error ? formErrorMessage(archive.error) : null}
        onConfirm={() =>
          archive.mutate(true, {
            onSuccess: () => {
              setDialog(null);
              toast.success(t('detail.archived'));
            },
          })
        }
      />
    </header>
  );
}

type ClassTab = 'assignments' | 'students';

function TabLink({ href, current, children }: { href: Route; current: boolean; children: string }) {
  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      className="-mb-px inline-flex min-h-11 shrink-0 whitespace-nowrap items-center border-b-2 border-transparent px-3 font-medium text-text-muted transition-colors duration-fast ease-standard hover:text-primary aria-[current=page]:border-primary aria-[current=page]:text-primary"
    >
      {children}
    </Link>
  );
}

export function ClassDetail({ id }: { id: string }) {
  const { t } = useTranslation('classes');
  const searchParams = useSearchParams();
  const readPage = (key: string) =>
    paginationSchema.shape.page.catch(1).parse(searchParams.get(key) ?? undefined);
  const page = readPage('page');
  const assignmentsView: AssignmentsView = {
    status: assignmentListQuerySchema.shape.status.parse(searchParams.get('astatus') ?? undefined),
    q: (searchParams.get('aq') ?? '').slice(0, LIST_SEARCH_MAX_LENGTH),
    sort: assignmentListQuerySchema.shape.sort.parse(searchParams.get('asort') ?? undefined),
    page: readPage('apage'),
  };
  const tab: ClassTab = searchParams.get('tab') === 'students' ? 'students' : 'assignments';
  const memberQuery = (searchParams.get('q') ?? '').slice(0, CLASS_MEMBER_SEARCH_MAX_LENGTH);
  const memberSort = classMemberListQuerySchema.shape.sort.parse(
    searchParams.get('sort') ?? undefined,
  );
  const router = useRouter();
  // Tab và số trang nằm trong URL để nút quay lại của trình duyệt về đúng chỗ.
  const classHref = (next: {
    tab?: ClassTab;
    page?: number;
    q?: string;
    sort?: string;
    assignments?: AssignmentsView;
  }) => {
    const params = new URLSearchParams();
    const nextTab = next.tab ?? tab;
    if (nextTab === 'students') params.set('tab', 'students');
    if (next.q) params.set('q', next.q);
    if (next.sort && next.sort !== 'joinedAt') params.set('sort', next.sort);
    if ((next.page ?? 1) > 1) params.set('page', String(next.page));
    const view = next.assignments;
    if (view && view.status !== 'all') params.set('astatus', view.status);
    if (view?.q) params.set('aq', view.q);
    if (view && view.sort !== 'due') params.set('asort', view.sort);
    if (view && view.page > 1) params.set('apage', String(view.page));
    const query = params.toString();
    return `/classes/${id}${query ? `?${query}` : ''}` as Route;
  };
  const klass = useQuery({ queryKey: classKeys.detail(id), queryFn: () => getClass(id) });

  if (klass.isPending) {
    return (
      <LoadingState label={t('detail.loading')}>
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </LoadingState>
    );
  }
  if (klass.isError) {
    const missing = klass.error instanceof HttpError && [403, 404].includes(klass.error.status);
    return (
      <>
        <BackLink href="/classes" label={t('detail.backToClasses')} />
        {missing ? (
          <EmptyState title={t('detail.notFound')} description={t('detail.notFoundHint')} />
        ) : (
          <ErrorState
            title={t('detail.failed')}
            description={t('checkNetwork')}
            onRetry={() => void klass.refetch()}
          />
        )}
      </>
    );
  }

  return (
    <>
      <BackLink href="/classes" label={t('detail.backToClasses')} />
      <ClassHeader klass={klass.data} />
      <nav
        aria-label={t('detail.sections')}
        className="flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar"
      >
        <TabLink href={classHref({ tab: 'assignments' })} current={tab === 'assignments'}>
          {t('detail.assignmentsTab')}
        </TabLink>
        <TabLink href={classHref({ tab: 'students' })} current={tab === 'students'}>
          {t('detail.studentsTab', { count: klass.data.memberCount })}
        </TabLink>
      </nav>
      {tab === 'assignments' ? (
        <ClassAssignments
          classId={klass.data.id}
          archived={klass.data.archivedAt !== null}
          view={assignmentsView}
          hrefFor={(assignments) => classHref({ tab: 'assignments', assignments })}
        />
      ) : (
        <ClassMembers
          key={`${memberQuery}:${memberSort}`}
          klass={klass.data}
          page={page}
          query={memberQuery}
          sort={memberSort}
          hrefFor={(next) =>
            classHref({ tab: 'students', page: next, q: memberQuery, sort: memberSort })
          }
          onSearch={({ q, sort }) => router.push(classHref({ tab: 'students', q, sort }))}
          clearHref={classHref({ tab: 'students' })}
        />
      )}
    </>
  );
}
