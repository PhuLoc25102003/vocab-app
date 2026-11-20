'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { STUDY_MODE_LABELS, type Assignment } from '@vocab/shared';
import { CalendarClock, ClipboardList, Trash2 } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { ASSIGNMENTS_PAGE_SIZE, classKeys, listAssignments, removeAssignment } from '../api';
import { formatDateTime } from '../format';
import { AssignDialog } from './assign-dialog';

function AssignmentRow({ classId, item, now }: { classId: string; item: Assignment; now: number }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const remove = useMutation({ mutationFn: () => removeAssignment(classId, item.id) });
  const overdue = item.dueAt !== null && new Date(item.dueAt).getTime() < now;

  return (
    <li className="flex min-h-16 items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <span className="flex min-w-0 flex-col gap-1">
        <Link
          href={`/classes/${classId}/assignments/${item.id}` as Route}
          className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 wrap-anywhere hover:underline"
        >
          {item.setTitle}
          <span className="sr-only">, xem kết quả</span>
        </Link>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-text-muted">
          <span className="rounded-sm bg-primary-soft px-2 text-tiny text-primary">
            {STUDY_MODE_LABELS[item.mode]}
          </span>
          <span className="flex items-center gap-1">
            <CalendarClock aria-hidden className="size-4" />
            {item.dueAt ? `Hạn ${formatDateTime(item.dueAt)}` : 'Không có hạn'}
          </span>
          {overdue ? <span className="font-medium text-danger">Đã quá hạn</span> : null}
        </span>
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Huỷ bài giao ${item.setTitle}`}
        onClick={() => setConfirming(true)}
      >
        <Trash2 aria-hidden className="size-5" />
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Huỷ bài giao ${item.setTitle}?`}
        description="Học sinh không còn thấy bài này trong danh sách bài cần làm. Kết quả các em đã học vẫn được giữ."
        confirmLabel="Huỷ bài giao"
        cancelLabel="Giữ lại"
        pending={remove.isPending}
        error={remove.error ? formErrorMessage(remove.error) : null}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: async () => {
              await queryClient.invalidateQueries({ queryKey: classKeys.assignments(classId) });
              setConfirming(false);
              toast.success('Đã huỷ bài giao');
            },
          })
        }
      />
    </li>
  );
}

interface ClassAssignmentsProps {
  classId: string;
  archived: boolean;
  page?: number;
  /** Đường dẫn của trang `page`, giữ các tham số khác của trang lớp. */
  hrefFor?: (page: number) => Route;
}

export function ClassAssignments({
  classId,
  archived,
  page = 1,
  hrefFor = (next) => `/classes/${classId}?apage=${next}` as Route,
}: ClassAssignmentsProps) {
  const [assigning, setAssigning] = useState(false);
  const [now] = useState(() => Date.now());
  const assignments = useQuery({
    queryKey: classKeys.assignmentsPage(classId, page),
    queryFn: () => listAssignments(classId, page),
  });

  let body;
  if (assignments.isPending) {
    body = (
      <LoadingState label="Đang tải bài đã giao">
        <Skeleton className="h-16 w-full" />
      </LoadingState>
    );
  } else if (assignments.isError) {
    body = (
      <ErrorState
        title="Không tải được bài đã giao"
        description="Kiểm tra kết nối mạng rồi thử lại."
        onRetry={() => void assignments.refetch()}
      />
    );
  } else if (assignments.data.data.length === 0) {
    body = (
      <p className="text-text-muted">Chưa giao bài nào. Giao một bộ từ để học sinh bắt đầu học.</p>
    );
  } else {
    const { meta } = assignments.data;
    body = (
      <>
        <ul aria-label="Bài đã giao" className="flex flex-col">
          {assignments.data.data.map((item) => (
            <AssignmentRow key={item.id} classId={classId} item={item} now={now} />
          ))}
        </ul>
        <Pagination
          page={meta.page}
          pageCount={Math.ceil(meta.total / ASSIGNMENTS_PAGE_SIZE)}
          hrefFor={hrefFor}
        />
      </>
    );
  }

  return (
    <section aria-labelledby="assignments-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="assignments-title" className="text-h2">
          Bài đã giao
        </h2>
        {archived ? null : (
          <Button onClick={() => setAssigning(true)}>
            <ClipboardList aria-hidden className="size-4" />
            Giao bài
          </Button>
        )}
      </div>
      <AssignDialog classId={classId} open={assigning} onOpenChange={setAssigning} />
      {body}
    </section>
  );
}
