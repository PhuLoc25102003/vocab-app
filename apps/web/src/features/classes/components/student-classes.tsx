'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ERROR_CODES,
  joinClassSchema,
  JOIN_CODE_LENGTH,
  STUDY_MODE_LABELS,
  type AssignmentStatus,
  type JoinClassInput,
  type JoinedClass,
  type MyAssignment,
  paginationSchema,
} from '@vocab/shared';
import {
  CalendarClock,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { FormField } from '@/components/common/form-field';
import { LoadingState } from '@/components/common/loading-state';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { HttpError } from '@/lib/http';
import { cn } from '@/lib/utils';
import {
  classKeys,
  JOINED_PAGE_SIZE,
  joinClass,
  leaveClass,
  listJoinedClasses,
  listMyAssignments,
} from '../api';
import { formatDateTime } from '../format';

const STATUS: Record<AssignmentStatus, { label: string; icon: LucideIcon; className: string }> = {
  pending: { label: 'Cần làm', icon: CircleDashed, className: 'text-primary' },
  overdue: { label: 'Quá hạn', icon: CircleAlert, className: 'text-danger' },
  done: { label: 'Đã làm', icon: CircleCheck, className: 'text-success' },
};

/** Đường dẫn chế độ học trùng tên chế độ viết thường, ví dụ `MCQ` thành `mcq`. */
const studyHref = ({ setId, mode }: MyAssignment) =>
  `/sets/${setId}/study/${mode.toLowerCase()}` as Route;

function JoinForm() {
  const queryClient = useQueryClient();
  const join = useMutation({ mutationFn: (dto: JoinClassInput) => joinClass(dto) });
  const form = useForm<{ joinCode: string }, unknown, JoinClassInput>({
    resolver: zodResolver(joinClassSchema),
    defaultValues: { joinCode: '' },
  });

  const submit = form.handleSubmit((dto) =>
    join.mutate(dto, {
      onSuccess: async (joined) => {
        await queryClient.invalidateQueries({ queryKey: classKeys.all });
        form.reset();
        toast.success(`Đã vào lớp ${joined.name}`);
      },
      onError: (error) => {
        const message =
          error instanceof HttpError && error.code === ERROR_CODES.CLASS_NOT_FOUND
            ? 'Không có lớp nào dùng mã này. Hỏi lại giáo viên mã mới nhất.'
            : formErrorMessage(error);
        form.setError('joinCode', { message });
      },
    }),
  );

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-label="Tham gia lớp"
      className="flex flex-wrap items-start gap-3 rounded-md border border-primary bg-primary-soft p-4"
    >
      <div className="min-w-0 flex-1 basis-48">
        <FormField
          label="Mã lớp"
          hint={`Mã ${JOIN_CODE_LENGTH} ký tự giáo viên gửi cho bạn.`}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={JOIN_CODE_LENGTH + 4}
          className="font-mono tracking-[0.2em] uppercase"
          error={form.formState.errors.joinCode?.message}
          {...form.register('joinCode')}
        />
      </div>
      <Button type="submit" loading={join.isPending} className="sm:mt-6">
        Tham gia lớp
      </Button>
    </form>
  );
}

function AssignmentRow({ item }: { item: MyAssignment }) {
  const { label, icon: Icon, className } = STATUS[item.status];
  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        href={studyHref(item)}
        className="flex min-h-16 items-center gap-3 py-3 transition-colors duration-fast ease-standard hover:bg-primary-soft sm:px-2"
      >
        <span
          className={cn('flex w-24 shrink-0 items-center gap-1 text-small font-medium', className)}
        >
          <Icon aria-hidden className="size-4 shrink-0" />
          {label}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-medium wrap-anywhere">{item.setTitle}</span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-text-muted">
            <span>{item.className}</span>
            <span className="rounded-sm bg-primary-soft px-2 text-tiny text-primary">
              {STUDY_MODE_LABELS[item.mode]}
            </span>
            {item.dueAt ? (
              <span className="flex items-center gap-1">
                <CalendarClock aria-hidden className="size-4" />
                Hạn {formatDateTime(item.dueAt)}
              </span>
            ) : null}
          </span>
        </span>
        <ChevronRight aria-hidden className="size-5 shrink-0 text-text-muted" />
      </Link>
    </li>
  );
}

function MyAssignments() {
  const assignments = useQuery({ queryKey: classKeys.myAssignments, queryFn: listMyAssignments });

  let body;
  if (assignments.isPending) {
    body = (
      <LoadingState label="Đang tải bài cần làm">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </LoadingState>
    );
  } else if (assignments.isError) {
    body = (
      <ErrorState
        title="Không tải được bài cần làm"
        description="Kiểm tra kết nối mạng rồi thử lại."
        onRetry={() => void assignments.refetch()}
      />
    );
  } else if (assignments.data.data.length === 0) {
    body = <p className="text-text-muted">Chưa có bài nào. Bài giáo viên giao sẽ hiện ở đây.</p>;
  } else {
    // Bài chưa làm lên trước, giữ thứ tự hạn gần nhất từ máy chủ.
    const rank: Record<AssignmentStatus, number> = { overdue: 0, pending: 1, done: 2 };
    const sorted = [...assignments.data.data].sort((a, b) => rank[a.status] - rank[b.status]);
    body = (
      <ul aria-label="Bài cần làm" className="flex flex-col">
        {sorted.map((item) => (
          <AssignmentRow key={item.id} item={item} />
        ))}
      </ul>
    );
  }

  return (
    <section aria-labelledby="my-assignments-title" className="flex flex-col gap-3">
      <h2 id="my-assignments-title" className="text-h2">
        Bài cần làm
      </h2>
      {body}
    </section>
  );
}

function JoinedRow({ item }: { item: JoinedClass }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const leave = useMutation({ mutationFn: () => leaveClass(item.id) });

  return (
    <li className="flex min-h-16 items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <span className="flex min-w-0 flex-col">
        <span className="font-medium wrap-anywhere">{item.name}</span>
        <span className="text-small wrap-anywhere text-text-muted">
          Giáo viên {item.teacherName}
        </span>
      </span>
      <Button
        variant="ghost"
        aria-label={`Rời lớp ${item.name}`}
        onClick={() => setConfirming(true)}
      >
        <LogOut aria-hidden className="size-4" />
        Rời lớp
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Rời lớp ${item.name}?`}
        description="Bạn không còn thấy bài của lớp và bộ từ của lớp. Muốn vào lại thì cần mã lớp."
        confirmLabel="Rời lớp"
        cancelLabel="Ở lại"
        pending={leave.isPending}
        error={leave.error ? formErrorMessage(leave.error) : null}
        onConfirm={() =>
          leave.mutate(undefined, {
            onSuccess: async () => {
              await queryClient.invalidateQueries({ queryKey: classKeys.all });
              setConfirming(false);
              toast.success(`Đã rời lớp ${item.name}`);
            },
          })
        }
      />
    </li>
  );
}

function JoinedClasses() {
  const searchParams = useSearchParams();
  const page = paginationSchema.shape.page.catch(1).parse(searchParams.get('cpage') ?? undefined);
  const joined = useQuery({
    queryKey: classKeys.joinedPage(page),
    queryFn: () => listJoinedClasses(page),
  });

  let body;
  if (joined.isPending) {
    body = (
      <LoadingState label="Đang tải lớp đã tham gia">
        <Skeleton className="h-16 w-full" />
      </LoadingState>
    );
  } else if (joined.isError) {
    body = (
      <ErrorState
        title="Không tải được lớp đã tham gia"
        description="Kiểm tra kết nối mạng rồi thử lại."
        onRetry={() => void joined.refetch()}
      />
    );
  } else if (joined.data.data.length === 0) {
    body = (
      <EmptyState
        title="Bạn chưa vào lớp nào"
        description="Nhập mã lớp giáo viên gửi ở ô phía trên để tham gia."
      />
    );
  } else {
    const { meta } = joined.data;
    body = (
      <>
        <ul aria-label="Lớp đã tham gia" className="flex flex-col">
          {joined.data.data.map((item) => (
            <JoinedRow key={item.id} item={item} />
          ))}
        </ul>
        <Pagination
          page={meta.page}
          pageCount={Math.ceil(meta.total / JOINED_PAGE_SIZE)}
          hrefFor={(next) => `/classes?cpage=${next}` as Route}
        />
      </>
    );
  }

  return (
    <section aria-labelledby="joined-title" className="flex flex-col gap-3">
      <h2 id="joined-title" className="text-h2">
        Lớp đã tham gia
      </h2>
      {body}
    </section>
  );
}

export function StudentClasses() {
  return (
    <>
      <PageHeader title="Lớp học" description="Tham gia lớp bằng mã và làm bài giáo viên giao." />
      <JoinForm />
      <MyAssignments />
      <JoinedClasses />
    </>
  );
}
