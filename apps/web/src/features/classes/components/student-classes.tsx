'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ERROR_CODES,
  joinClassSchema,
  JOIN_CODE_LENGTH,
  STUDY_MODE_LABELS,
  type ProgressStatus,
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
  CircleDot,
  Clock,
  LogIn,
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
import { FormDialog } from '@/components/common/form-dialog';
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
  MY_ASSIGNMENTS_PAGE_SIZE,
} from '../api';
import { formatDateTime } from '../format';

const STATUS: Record<ProgressStatus, { label: string; icon: LucideIcon; className: string }> = {
  todo: { label: 'Chưa làm', icon: CircleDashed, className: 'text-text-muted' },
  in_progress: { label: 'Đang làm', icon: CircleDot, className: 'text-primary' },
  submitted: { label: 'Đã nộp', icon: CircleCheck, className: 'text-success' },
  late: { label: 'Nộp trễ', icon: Clock, className: 'text-warning' },
  missed: { label: 'Bỏ lỡ', icon: CircleAlert, className: 'text-danger' },
};

/** Đường dẫn chế độ học trùng tên chế độ viết thường, ví dụ `MCQ` thành `mcq`. */
const studyHref = ({ setId, mode }: MyAssignment) =>
  `/sets/${setId}/study/${mode.toLowerCase()}` as Route;

function JoinDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const join = useMutation({ mutationFn: (dto: JoinClassInput) => joinClass(dto) });
  const form = useForm<{ joinCode: string }, unknown, JoinClassInput>({
    resolver: zodResolver(joinClassSchema),
    defaultValues: { joinCode: '' },
  });

  const close = (next: boolean) => {
    if (!next) {
      form.reset();
      join.reset();
    }
    onOpenChange(next);
  };

  const submit = form.handleSubmit((dto) =>
    join.mutate(dto, {
      onSuccess: async (joined) => {
        await queryClient.invalidateQueries({ queryKey: classKeys.all });
        toast.success(`Đã vào lớp ${joined.name}`);
        close(false);
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
    <FormDialog
      open={open}
      onOpenChange={close}
      title="Tham gia lớp"
      description={`Nhập mã ${JOIN_CODE_LENGTH} ký tự giáo viên gửi cho bạn.`}
      submitLabel="Tham gia"
      pending={join.isPending}
      dirty={form.formState.isDirty}
      onSubmit={(event) => void submit(event)}
    >
      <FormField
        label="Mã lớp"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={JOIN_CODE_LENGTH + 4}
        className="font-mono tracking-[0.2em] uppercase"
        error={form.formState.errors.joinCode?.message}
        {...form.register('joinCode')}
      />
    </FormDialog>
  );
}

function AssignmentRow({ item }: { item: MyAssignment }) {
  const { label, icon: Icon, className } = STATUS[item.progressStatus];
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
              {item.modes.length > 1 ? ` +${item.modes.length - 1}` : ''}
            </span>
            {item.modes.length > 1 ? (
              <span className="tabular-nums">
                {item.doneModes}/{item.modes.length} chế độ
              </span>
            ) : null}
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
  const searchParams = useSearchParams();
  const page = paginationSchema.shape.page.catch(1).parse(searchParams.get('bpage') ?? undefined);
  const assignments = useQuery({
    queryKey: classKeys.myAssignmentsPage(page),
    queryFn: () => listMyAssignments(page),
  });

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
    const { meta } = assignments.data;
    body = (
      <>
        <ul aria-label="Bài cần làm" className="flex flex-col">
          {assignments.data.data.map((item) => (
            <AssignmentRow key={item.id} item={item} />
          ))}
        </ul>
        <Pagination
          page={meta.page}
          pageCount={Math.ceil(meta.total / MY_ASSIGNMENTS_PAGE_SIZE)}
          hrefFor={(next) => `/classes?bpage=${next}` as Route}
        />
      </>
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
        description="Bấm Tham gia lớp ở đầu trang rồi nhập mã giáo viên gửi."
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
  const [joining, setJoining] = useState(false);
  return (
    <>
      <PageHeader
        title="Lớp học"
        description="Tham gia lớp bằng mã và làm bài giáo viên giao."
        actions={
          <Button onClick={() => setJoining(true)}>
            <LogIn aria-hidden className="size-4" />
            Tham gia lớp
          </Button>
        }
      />
      <JoinDialog open={joining} onOpenChange={setJoining} />
      <MyAssignments />
      <JoinedClasses />
    </>
  );
}
