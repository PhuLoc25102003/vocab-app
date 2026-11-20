'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAssignmentSchema,
  STUDY_MODE_LABELS,
  studyModeSchema,
  type Assignment,
  type StudyMode,
} from '@vocab/shared';
import { CalendarClock, ClipboardList, Trash2 } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { FormField, SelectField } from '@/components/common/form-field';
import { FormError } from '@/components/common/form-message';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import {
  classKeys,
  createAssignment,
  listAssignments,
  listMySetsForAssigning,
  removeAssignment,
} from '../api';
import { formatDateTime } from '../format';

type FieldErrors = Partial<Record<'setId' | 'dueAt', string>>;

/** `datetime-local` không có múi giờ, hiểu theo giờ máy của giáo viên rồi đổi sang ISO. */
function toIsoDue(local: string): string | null {
  if (!local) return null;
  const date = new Date(local);
  return Number.isNaN(date.getTime()) ? 'invalid' : date.toISOString();
}

function AssignForm({ classId, onDone }: { classId: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const sets = useQuery({ queryKey: classKeys.mySets, queryFn: listMySetsForAssigning });
  const assign = useMutation({
    mutationFn: (dto: Parameters<typeof createAssignment>[1]) => createAssignment(classId, dto),
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = createAssignmentSchema.safeParse({
      setId: String(data.get('setId') ?? ''),
      mode: String(data.get('mode') ?? ''),
      dueAt: toIsoDue(String(data.get('dueAt') ?? '')),
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === 'setId' || key === 'dueAt') next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    assign.mutate(parsed.data, {
      onSuccess: async (created) => {
        await queryClient.invalidateQueries({ queryKey: classKeys.assignments(classId) });
        toast.success(`Đã giao ${created.setTitle}`);
        onDone();
      },
    });
  };

  if (sets.isPending) {
    return (
      <LoadingState label="Đang tải bộ từ của bạn">
        <Skeleton className="h-40 w-full" />
      </LoadingState>
    );
  }
  if (sets.isError) {
    return (
      <ErrorState
        title="Không tải được bộ từ của bạn"
        description="Kiểm tra kết nối mạng rồi thử lại."
        onRetry={() => void sets.refetch()}
      />
    );
  }
  if (sets.data.length === 0) {
    return (
      <EmptyState
        title="Bạn chưa có bộ từ nào"
        description="Tạo bộ từ ở mục Bộ từ, đặt Ai xem được là Công khai, rồi quay lại giao bài."
        action={
          <Button variant="secondary" onClick={onDone}>
            Đóng
          </Button>
        }
      />
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-labelledby="assign-title"
      className="flex flex-col gap-4 rounded-md border border-border-strong bg-surface p-4"
    >
      <h3 id="assign-title" className="text-h3">
        Giao bài mới
      </h3>
      {assign.error ? <FormError>{formErrorMessage(assign.error)}</FormError> : null}
      <SelectField
        label="Bộ từ"
        name="setId"
        defaultValue=""
        hint="Bộ riêng tư không giao được vì học sinh không xem được. Đổi sang Công khai ở trang sửa bộ từ."
        error={errors.setId}
      >
        <option value="" disabled>
          Chọn bộ từ
        </option>
        {sets.data.map((set) => (
          <option key={set.id} value={set.id} disabled={set.visibility === 'PRIVATE'}>
            {set.title} ({set.cardCount} thẻ){set.visibility === 'PRIVATE' ? ', riêng tư' : ''}
          </option>
        ))}
      </SelectField>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Chế độ học" name="mode" defaultValue={'MCQ' satisfies StudyMode}>
          {studyModeSchema.options.map((mode) => (
            <option key={mode} value={mode}>
              {STUDY_MODE_LABELS[mode]}
            </option>
          ))}
        </SelectField>
        <FormField
          label="Hạn nộp (không bắt buộc)"
          name="dueAt"
          type="datetime-local"
          hint="Bỏ trống nếu bài không có hạn."
          error={errors.dueAt}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={assign.isPending}>
          Giao bài
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Huỷ
        </Button>
      </div>
    </form>
  );
}

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

export function ClassAssignments({ classId, archived }: { classId: string; archived: boolean }) {
  const [assigning, setAssigning] = useState(false);
  const [now] = useState(() => Date.now());
  const assignments = useQuery({
    queryKey: classKeys.assignments(classId),
    queryFn: () => listAssignments(classId),
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
    body = assigning ? null : (
      <p className="text-text-muted">Chưa giao bài nào. Giao một bộ từ để học sinh bắt đầu học.</p>
    );
  } else {
    body = (
      <ul aria-label="Bài đã giao" className="flex flex-col">
        {assignments.data.data.map((item) => (
          <AssignmentRow key={item.id} classId={classId} item={item} now={now} />
        ))}
      </ul>
    );
  }

  return (
    <section aria-labelledby="assignments-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="assignments-title" className="text-h2">
          Bài đã giao
        </h2>
        {assigning || archived ? null : (
          <Button onClick={() => setAssigning(true)}>
            <ClipboardList aria-hidden className="size-4" />
            Giao bài
          </Button>
        )}
      </div>
      {assigning ? <AssignForm classId={classId} onDone={() => setAssigning(false)} /> : null}
      {body}
    </section>
  );
}
