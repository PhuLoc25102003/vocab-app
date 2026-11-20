'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paginationSchema, type Class, type ClassMember } from '@vocab/shared';
import { Archive, ArchiveRestore, Copy, RefreshCw, Trash2 } from 'lucide-react';
import type { Route } from 'next';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { BackLink } from '@/components/common/back-link';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
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

function JoinCodePanel({ klass }: { klass: Class }) {
  const [confirming, setConfirming] = useState(false);
  const regenerate = useClassMutation(() => regenerateJoinCode(klass.id));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(klass.joinCode);
      toast.success('Đã sao chép mã lớp');
    } catch {
      toast.error('Không sao chép được. Hãy chép tay mã lớp.');
    }
  };

  return (
    <section
      aria-labelledby="join-code-title"
      className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-primary bg-primary-soft p-4"
    >
      <div className="flex flex-col gap-1">
        <h2 id="join-code-title" className="text-small font-medium text-text-muted">
          Mã lớp
        </h2>
        <p className="font-mono text-h1 tracking-[0.2em] text-primary">{klass.joinCode}</p>
        <p className="text-small text-text-muted">
          {klass.archivedAt
            ? 'Lớp đã lưu trữ nên không nhận thêm học sinh.'
            : 'Học sinh vào mục Lớp học, nhập mã này để tham gia.'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => void copy()}>
          <Copy aria-hidden className="size-4" />
          Sao chép mã
        </Button>
        <Button variant="secondary" onClick={() => setConfirming(true)}>
          <RefreshCw aria-hidden className="size-4" />
          Đổi mã
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Đổi mã lớp?"
        description="Mã cũ hết hiệu lực ngay. Học sinh đã trong lớp vẫn ở lại, học sinh mới cần mã mới."
        confirmLabel="Đổi mã"
        pending={regenerate.isPending}
        error={regenerate.error ? formErrorMessage(regenerate.error) : null}
        onConfirm={() =>
          regenerate.mutate(undefined, {
            onSuccess: () => {
              setConfirming(false);
              toast.success('Đã đổi mã lớp');
            },
          })
        }
      />
    </section>
  );
}

function MemberRow({ classId, member }: { classId: string; member: ClassMember }) {
  const [confirming, setConfirming] = useState(false);
  const remove = useClassMutation(() => removeMember(classId, member.userId));

  return (
    <li className="flex min-h-14 items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <span className="flex min-w-0 flex-col">
        <span className="font-medium wrap-anywhere">{member.displayName}</span>
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

function Members({ klass, page }: { klass: Class; page: number }) {
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
          hrefFor={(next) => `/classes/${klass.id}?page=${next}` as Route}
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

function ArchiveButton({ klass }: { klass: Class }) {
  const archived = klass.archivedAt !== null;
  const [confirming, setConfirming] = useState(false);
  const update = useClassMutation((value: boolean) => updateClass(klass.id, { archived: value }));

  if (archived) {
    return (
      <Button
        variant="secondary"
        loading={update.isPending}
        onClick={() =>
          update.mutate(false, {
            onSuccess: () => toast.success('Đã mở lại lớp'),
            onError: (error) => toast.error(formErrorMessage(error)),
          })
        }
      >
        <ArchiveRestore aria-hidden className="size-4" />
        Mở lại lớp
      </Button>
    );
  }
  return (
    <>
      <Button variant="secondary" onClick={() => setConfirming(true)}>
        <Archive aria-hidden className="size-4" />
        Lưu trữ lớp
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Lưu trữ lớp ${klass.name}?`}
        description="Lớp ẩn khỏi danh sách đang dạy, mã lớp ngừng nhận học sinh mới. Bạn mở lại được bất cứ lúc nào."
        confirmLabel="Lưu trữ"
        pending={update.isPending}
        error={update.error ? formErrorMessage(update.error) : null}
        onConfirm={() =>
          update.mutate(true, {
            onSuccess: () => {
              setConfirming(false);
              toast.success('Đã lưu trữ lớp');
            },
          })
        }
      />
    </>
  );
}

export function ClassDetail({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const page = paginationSchema.shape.page.catch(1).parse(searchParams.get('page') ?? undefined);
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
      <PageHeader
        title={klass.data.name}
        description={klass.data.description ?? undefined}
        actions={<ArchiveButton klass={klass.data} />}
      />
      {klass.data.archivedAt ? (
        <p
          role="status"
          className="max-w-[65ch] border-l-4 border-border-strong pl-3 text-text-muted"
        >
          Lớp đã lưu trữ ngày {formatDate(klass.data.archivedAt)}.
        </p>
      ) : null}
      <JoinCodePanel klass={klass.data} />
      <ClassAssignments classId={klass.data.id} archived={klass.data.archivedAt !== null} />
      <Members klass={klass.data} page={page} />
    </>
  );
}
