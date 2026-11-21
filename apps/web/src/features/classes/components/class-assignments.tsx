'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ASSIGNMENT_WINDOWS,
  type AssignmentWindow,
  type ClassAssignment,
  STUDY_MODE_LABELS,
} from '@vocab/shared';
import {
  CalendarClock,
  CircleCheck,
  CircleDashed,
  ClipboardList,
  Clock,
  Trash2,
  Users,
} from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
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
import {
  type AssignmentFilter,
  ASSIGNMENTS_PAGE_SIZE,
  classKeys,
  listAssignments,
  removeAssignment,
} from '../api';
import { formatDateTime } from '../format';
import { AssignDialog } from './assign-dialog';
import { AssignmentRow } from './assignment-row';

type AssignmentSort = NonNullable<AssignmentFilter['sort']>;

/** Bộ lọc tab Bài tập của lớp, nằm trong URL (việc 5.32). */
export interface AssignmentsView {
  status: AssignmentWindow;
  q: string;
  sort: AssignmentSort;
  page: number;
}

export const DEFAULT_ASSIGNMENTS_VIEW: AssignmentsView = {
  status: 'all',
  q: '',
  sort: 'due',
  page: 1,
};

const WINDOW_LABELS: Record<AssignmentWindow, string> = {
  open: 'Còn hạn',
  closed: 'Hết hạn',
  all: 'Tất cả',
};

const SORT_LABELS: Record<AssignmentSort, string> = {
  due: 'Hạn gần nhất',
  '-createdAt': 'Mới giao trước',
};

const ROW_STATUS = {
  none: { label: 'Không hạn', icon: CircleDashed, className: 'text-text-muted' },
  open: { label: 'Còn hạn', icon: Clock, className: 'text-primary' },
  closed: { label: 'Hết hạn', icon: CircleCheck, className: 'text-text-muted' },
};

function TeacherAssignmentRow({
  classId,
  item,
  now,
}: {
  classId: string;
  item: ClassAssignment;
  now: number;
}) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const remove = useMutation({ mutationFn: () => removeAssignment(classId, item.id) });
  const modes = item.modes ?? [item.mode];
  let status = ROW_STATUS.none;
  if (item.dueAt)
    status = new Date(item.dueAt).getTime() < now ? ROW_STATUS.closed : ROW_STATUS.open;

  return (
    <AssignmentRow
      href={`/classes/${classId}/assignments/${item.id}` as Route}
      status={status}
      title={item.setTitle}
      action={
        <>
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
        </>
      }
    >
      <span className="rounded-sm bg-primary-soft px-2 text-tiny text-primary">
        {STUDY_MODE_LABELS[modes[0] ?? item.mode]}
        {modes.length > 1 ? ` +${modes.length - 1}` : ''}
      </span>
      <span className="flex items-center gap-1">
        <CalendarClock aria-hidden className="size-4" />
        {item.dueAt ? `Hạn ${formatDateTime(item.dueAt)}` : 'Không có hạn'}
      </span>
      <span className="flex items-center gap-1 tabular-nums">
        <Users aria-hidden className="size-4" />
        {item.submittedCount}/{item.memberCount} đã nộp
      </span>
    </AssignmentRow>
  );
}

interface ClassAssignmentsProps {
  classId: string;
  archived: boolean;
  view?: AssignmentsView;
  /** Đường dẫn của một bộ lọc, giữ các tham số khác của trang lớp. */
  hrefFor?: (view: AssignmentsView) => Route;
}

export function ClassAssignments({
  classId,
  archived,
  view = DEFAULT_ASSIGNMENTS_VIEW,
  hrefFor = ({ page }) => `/classes/${classId}?apage=${page}` as Route,
}: ClassAssignmentsProps) {
  const router = useRouter();
  const [assigning, setAssigning] = useState(false);
  const [now] = useState(() => Date.now());
  const go = (patch: Partial<AssignmentsView>) =>
    router.push(hrefFor({ ...view, page: 1, ...patch }));
  const filter: AssignmentFilter = {
    status: view.status,
    q: view.q || undefined,
    sort: view.sort,
  };
  const assignments = useQuery({
    queryKey: classKeys.assignmentsPage(classId, view.page, filter),
    queryFn: () => listAssignments(classId, view.page, filter),
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
    if (view.q) {
      body = (
        <ListNoMatch
          text={`Không có bài nào khớp "${view.q}".`}
          clearHref={hrefFor({ ...view, q: '', page: 1 })}
        />
      );
    } else if (view.status === 'all') {
      body = (
        <EmptyState
          title="Chưa giao bài nào"
          description="Giao một bộ từ để học sinh bắt đầu học."
        />
      );
    } else {
      body = (
        <p className="py-6 text-text-muted">
          {view.status === 'open' ? 'Không có bài nào còn hạn.' : 'Chưa có bài nào hết hạn.'}
        </p>
      );
    }
  } else {
    body = (
      <ul aria-label="Bài đã giao" className="flex flex-col">
        {assignments.data.data.map((item) => (
          <TeacherAssignmentRow key={item.id} classId={classId} item={item} now={now} />
        ))}
      </ul>
    );
  }

  return (
    <ListPanel
      title="Bài đã giao"
      count={assignments.data?.meta.total}
      actions={
        archived ? null : (
          <Button onClick={() => setAssigning(true)}>
            <ClipboardList aria-hidden className="size-4" />
            Giao bài
          </Button>
        )
      }
      toolbar={
        <ListToolbar
          key={view.q}
          tabs={ASSIGNMENT_WINDOWS.map((status) => ({
            label: WINDOW_LABELS[status],
            href: hrefFor({ ...view, status, page: 1 }),
            current: view.status === status,
            count: assignments.data?.counts[status],
          }))}
          search={{ label: 'Tìm theo tên bộ từ', value: view.q, onSearch: (q) => go({ q }) }}
          filters={
            <ListFilter>
              <Select
                aria-label="Sắp xếp bài đã giao"
                value={view.sort}
                onChange={(event) => go({ sort: event.target.value as AssignmentSort })}
              >
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </ListFilter>
          }
        />
      }
      footer={
        assignments.data && assignments.data.meta.total > 0 ? (
          <ListPager
            page={assignments.data.meta.page}
            pageSize={ASSIGNMENTS_PAGE_SIZE}
            total={assignments.data.meta.total}
            hrefFor={(page) => hrefFor({ ...view, page })}
          />
        ) : null
      }
    >
      <AssignDialog classId={classId} open={assigning} onOpenChange={setAssigning} />
      {body}
    </ListPanel>
  );
}
