'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createClassSchema,
  paginationSchema,
  type Class,
  type ClassMember,
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
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { BackLink } from '@/components/common/back-link';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { FormDialog } from '@/components/common/form-dialog';
import { FormField, TextareaField } from '@/components/common/form-field';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/menu';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { HttpError } from '@/lib/http';
import {
  classKeys,
  getClass,
  listMembers,
  MEMBERS_PAGE_SIZE,
  regenerateJoinCode,
  removeMember,
  updateClass,
} from '../api';
import { formatDate } from '../format';
import { ClassAssignments } from './class-assignments';

function useClassMutation<T>(mutationFn: (value: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classKeys.all }),
  });
}

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép mã ${code}`);
  } catch {
    toast.error('Không sao chép được. Hãy chép tay mã lớp.');
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
            Mời học sinh vào {klass.name}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Đóng"
            className="-mt-2 -mr-3 shrink-0"
            onClick={() => onOpenChange(false)}
          >
            <X aria-hidden className="size-5" />
          </Button>
        </div>
        <p className="text-text-muted">
          {klass.archivedAt
            ? 'Lớp đã lưu trữ nên mã không nhận thêm học sinh. Mở lại lớp để mời.'
            : 'Học sinh vào mục Lớp học, bấm "Tham gia lớp" rồi nhập mã này.'}
        </p>
        <p className="rounded-md bg-primary-soft py-6 text-center font-mono text-card tracking-[0.25em] text-primary">
          {klass.joinCode}
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onRegenerate}>
            <RefreshCw aria-hidden className="size-4" />
            Đổi mã
          </Button>
          <Button onClick={() => void copyCode(klass.joinCode)}>
            <Copy aria-hidden className="size-4" />
            Sao chép mã
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
          toast.success('Đã lưu lớp');
          close(false);
        },
      },
    ),
  );
  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title="Sửa lớp"
      submitLabel="Lưu"
      pending={update.isPending}
      error={update.error ? formErrorMessage(update.error) : null}
      dirty={form.formState.isDirty}
      onSubmit={(event) => void submit(event)}
    >
      <FormField
        label="Tên lớp"
        error={form.formState.errors.name?.message}
        {...form.register('name')}
      />
      <TextareaField
        label="Mô tả (không bắt buộc)"
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
  const [dialog, setDialog] = useState<Dialogs>(null);
  const regenerate = useClassMutation(() => regenerateJoinCode(klass.id));
  const archive = useClassMutation((value: boolean) => updateClass(klass.id, { archived: value }));
  const archived = klass.archivedAt !== null;
  // Mở hộp thoại sau khi menu đóng để focus không bị menu trả về nút "⋯".
  const openLater = (next: Dialogs) => () => setTimeout(() => setDialog(next));

  return (
    <header className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="min-w-0 text-h1 wrap-anywhere">{klass.name}</h1>
        <div className="flex items-center gap-1">
          <Button variant="secondary" onClick={() => setDialog('invite')}>
            <UserPlus aria-hidden className="size-4" />
            Mời học sinh
          </Button>
          <Menu>
            <MenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Thao tác với lớp ${klass.name}`}>
                <MoreHorizontal aria-hidden className="size-5" />
              </Button>
            </MenuTrigger>
            <MenuContent>
              <MenuItem onSelect={openLater('edit')}>
                <Pencil aria-hidden className="size-4" />
                Sửa tên và mô tả
              </MenuItem>
              <MenuItem onSelect={openLater('regenerate')}>
                <RefreshCw aria-hidden className="size-4" />
                Đổi mã lớp
              </MenuItem>
              <MenuSeparator />
              {archived ? (
                <MenuItem
                  onSelect={() =>
                    archive.mutate(false, {
                      onSuccess: () => toast.success('Đã mở lại lớp'),
                      onError: (error) => toast.error(formErrorMessage(error)),
                    })
                  }
                >
                  <ArchiveRestore aria-hidden className="size-4" />
                  Mở lại lớp
                </MenuItem>
              ) : (
                <MenuItem danger onSelect={openLater('archive')}>
                  <Archive aria-hidden className="size-4" />
                  Lưu trữ lớp
                </MenuItem>
              )}
            </MenuContent>
          </Menu>
        </div>
      </div>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-text-muted">
        {klass.description ? (
          <>
            <span className="min-w-0 wrap-anywhere">{klass.description}</span>
            <span aria-hidden>·</span>
          </>
        ) : null}
        <span className="tabular-nums">{klass.memberCount} học sinh</span>
        <span aria-hidden>·</span>
        <span className="flex items-center">
          <span className="rounded-sm bg-primary-soft px-2 font-mono tracking-wider text-primary">
            <span className="sr-only">Mã lớp </span>
            {klass.joinCode}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Sao chép mã lớp ${klass.joinCode}`}
            onClick={() => void copyCode(klass.joinCode)}
          >
            <Copy aria-hidden className="size-4" />
          </Button>
        </span>
      </p>
      {archived ? (
        <p
          role="status"
          className="max-w-[65ch] border-l-4 border-border-strong pl-3 text-text-muted"
        >
          Lớp đã lưu trữ ngày {formatDate(klass.archivedAt ?? '')}.
        </p>
      ) : null}

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
        title="Đổi mã lớp?"
        description="Mã cũ hết hiệu lực ngay. Học sinh đã trong lớp vẫn ở lại, học sinh mới cần mã mới."
        confirmLabel="Đổi mã"
        pending={regenerate.isPending}
        error={regenerate.error ? formErrorMessage(regenerate.error) : null}
        onConfirm={() =>
          regenerate.mutate(undefined, {
            onSuccess: () => {
              setDialog('invite');
              toast.success('Đã đổi mã lớp');
            },
          })
        }
      />
      <ConfirmDialog
        open={dialog === 'archive'}
        onOpenChange={(open) => setDialog(open ? 'archive' : null)}
        title={`Lưu trữ lớp ${klass.name}?`}
        description="Lớp ẩn khỏi danh sách đang dạy, mã lớp ngừng nhận học sinh mới. Bạn mở lại được bất cứ lúc nào."
        confirmLabel="Lưu trữ"
        pending={archive.isPending}
        error={archive.error ? formErrorMessage(archive.error) : null}
        onConfirm={() =>
          archive.mutate(true, {
            onSuccess: () => {
              setDialog(null);
              toast.success('Đã lưu trữ lớp');
            },
          })
        }
      />
    </header>
  );
}

function MemberRow({ classId, member }: { classId: string; member: ClassMember }) {
  const [confirming, setConfirming] = useState(false);
  const remove = useClassMutation(() => removeMember(classId, member.userId));

  return (
    <li className="flex min-h-14 items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <span className="flex min-w-0 flex-col">
        <Link
          href={`/classes/${classId}/members/${member.userId}` as Route}
          className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 wrap-anywhere hover:underline"
        >
          {member.displayName}
          <span className="sr-only">, xem kết quả</span>
        </Link>
        <span className="text-small text-text-muted">Vào lớp {formatDate(member.joinedAt)}</span>
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Xoá ${member.displayName} khỏi lớp`}
        onClick={() => setConfirming(true)}
      >
        <Trash2 aria-hidden className="size-5" />
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Xoá ${member.displayName} khỏi lớp?`}
        description="Học sinh không còn xem được bộ từ của lớp. Muốn vào lại thì cần mã lớp."
        confirmLabel="Xoá khỏi lớp"
        pending={remove.isPending}
        error={remove.error ? formErrorMessage(remove.error) : null}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => {
              setConfirming(false);
              toast.success(`Đã xoá ${member.displayName} khỏi lớp`);
            },
          })
        }
      />
    </li>
  );
}

function Members({
  klass,
  page,
  hrefFor,
}: {
  klass: Class;
  page: number;
  hrefFor: (page: number) => Route;
}) {
  const members = useQuery({
    queryKey: classKeys.members(klass.id, page),
    queryFn: () => listMembers(klass.id, page),
  });

  let body;
  if (members.isPending) {
    body = (
      <LoadingState label="Đang tải học sinh">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </LoadingState>
    );
  } else if (members.isError) {
    body = (
      <ErrorState
        title="Không tải được học sinh"
        description="Kiểm tra kết nối mạng rồi thử lại."
        onRetry={() => void members.refetch()}
      />
    );
  } else if (members.data.data.length === 0) {
    body = (
      <EmptyState
        title="Chưa có học sinh"
        description={`Gửi mã ${klass.joinCode} cho học sinh để các em tham gia lớp.`}
      />
    );
  } else {
    const { data, meta } = members.data;
    body = (
      <>
        <ul aria-label="Học sinh trong lớp" className="flex flex-col">
          {data.map((member) => (
            <MemberRow key={member.userId} classId={klass.id} member={member} />
          ))}
        </ul>
        <Pagination
          page={meta.page}
          pageCount={Math.ceil(meta.total / MEMBERS_PAGE_SIZE)}
          hrefFor={hrefFor}
        />
      </>
    );
  }

  return (
    <section aria-labelledby="members-title" className="flex flex-col gap-3">
      <h2 id="members-title" className="text-h2">
        Học sinh <span className="text-text-muted tabular-nums">({klass.memberCount})</span>
      </h2>
      {body}
    </section>
  );
}

type ClassTab = 'assignments' | 'students';

function TabLink({ href, current, children }: { href: Route; current: boolean; children: string }) {
  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      className="-mb-px inline-flex min-h-11 items-center border-b-2 border-transparent px-3 font-medium text-text-muted transition-colors duration-fast ease-standard hover:text-primary aria-[current=page]:border-primary aria-[current=page]:text-primary"
    >
      {children}
    </Link>
  );
}

export function ClassDetail({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const readPage = (key: string) =>
    paginationSchema.shape.page.catch(1).parse(searchParams.get(key) ?? undefined);
  const page = readPage('page');
  const assignmentsPage = readPage('apage');
  const tab: ClassTab = searchParams.get('tab') === 'students' ? 'students' : 'assignments';
  // Tab và số trang nằm trong URL để nút quay lại của trình duyệt về đúng chỗ.
  const classHref = (next: { tab?: ClassTab; page?: number; apage?: number }) => {
    const params = new URLSearchParams();
    const nextTab = next.tab ?? tab;
    if (nextTab === 'students') params.set('tab', 'students');
    if ((next.page ?? 1) > 1) params.set('page', String(next.page));
    if ((next.apage ?? 1) > 1) params.set('apage', String(next.apage));
    const query = params.toString();
    return `/classes/${id}${query ? `?${query}` : ''}` as Route;
  };
  const klass = useQuery({ queryKey: classKeys.detail(id), queryFn: () => getClass(id) });

  if (klass.isPending) {
    return (
      <LoadingState label="Đang tải lớp">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </LoadingState>
    );
  }
  if (klass.isError) {
    const missing = klass.error instanceof HttpError && [403, 404].includes(klass.error.status);
    return (
      <>
        <BackLink href="/classes" label="Quay lại Lớp học" />
        {missing ? (
          <EmptyState
            title="Không tìm thấy lớp"
            description="Lớp không tồn tại hoặc không phải lớp bạn dạy."
          />
        ) : (
          <ErrorState
            title="Không tải được lớp"
            description="Kiểm tra kết nối mạng rồi thử lại."
            onRetry={() => void klass.refetch()}
          />
        )}
      </>
    );
  }

  return (
    <>
      <BackLink href="/classes" label="Quay lại Lớp học" />
      <ClassHeader klass={klass.data} />
      <nav aria-label="Mục của lớp" className="flex gap-1 border-b border-border">
        <TabLink href={classHref({ tab: 'assignments' })} current={tab === 'assignments'}>
          Bài tập
        </TabLink>
        <TabLink href={classHref({ tab: 'students' })} current={tab === 'students'}>
          {`Học sinh (${klass.data.memberCount})`}
        </TabLink>
      </nav>
      {tab === 'assignments' ? (
        <ClassAssignments
          classId={klass.data.id}
          archived={klass.data.archivedAt !== null}
          page={assignmentsPage}
          hrefFor={(next) => classHref({ tab: 'assignments', apage: next })}
        />
      ) : (
        <Members
          klass={klass.data}
          page={page}
          hrefFor={(next) => classHref({ tab: 'students', page: next })}
        />
      )}
    </>
  );
}
