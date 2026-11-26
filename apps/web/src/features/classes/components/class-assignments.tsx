'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ASSIGNMENT_WINDOWS, type AssignmentWindow, type ClassAssignment } from '@vocab/shared';
import {
  CalendarClock,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  ClipboardList,
  Clock,
  Trash2,
  Users,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
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
import {
  DataTableContainer,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
} from '@/components/common/data-table';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { cn } from '@/lib/utils';
import {
  type AssignmentFilter,
  ASSIGNMENTS_PAGE_SIZE,
  classKeys,
  listAssignments,
  removeAssignment,
} from '../api';
import { formatDateTime } from '../format';
import { AssignDialog } from './assign-dialog';
import { useTranslation } from 'react-i18next';

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

const SORT_LABELS = {
  due: 'sort.due',
  '-createdAt': 'sort.created',
} as const satisfies Record<AssignmentSort, string>;

const ROW_STATUS = {
  none: { label: 'assignments.noDue', icon: CircleDashed, className: 'text-text-muted' },
  open: { label: 'assignments.open', icon: Clock, className: 'text-primary' },
  closed: { label: 'assignments.closed', icon: CircleCheck, className: 'text-text-muted' },
} as const;

const ASSIGNMENT_GRID = 'minmax(200px, 1.8fr) 130px 110px 170px 110px 70px';

function TeacherAssignmentRow({
  classId,
  item,
  now,
}: {
  classId: string;
  item: ClassAssignment;
  now: number;
}) {
  const { t } = useTranslation(['classes', 'common']);
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const remove = useMutation({ mutationFn: () => removeAssignment(classId, item.id) });
  const modes = item.modes ?? [item.mode];
  let status: (typeof ROW_STATUS)[keyof typeof ROW_STATUS] = ROW_STATUS.none;
  if (item.dueAt)
    status = new Date(item.dueAt).getTime() < now ? ROW_STATUS.closed : ROW_STATUS.open;

  const StatusIcon = status.icon;

  return (
    <DataTableRow
      as="li"
      gridTemplateColumns={ASSIGNMENT_GRID}
      className="relative items-center gap-4 py-3 hover:bg-primary-soft sm:px-3"
    >
      <DataTableCell className="flex min-w-0 flex-col">
        <Link
          href={`/classes/${classId}/assignments/${item.id}` as Route}
          className="inline-flex min-h-11 items-center truncate font-medium text-text hover:text-primary hover:underline after:absolute after:inset-0"
          title={item.setTitle}
        >
          {item.setTitle}
        </Link>
      </DataTableCell>

      <DataTableCell className="flex items-center">
        <span className="rounded-sm bg-primary-soft px-2 py-0.5 text-tiny font-medium text-primary whitespace-nowrap">
          {t(`common:modes.${modes[0] ?? item.mode}`)}
          {modes.length > 1 ? ` +${modes.length - 1}` : ''}
        </span>
      </DataTableCell>

      <DataTableCell className="flex items-center">
        <span className={cn('flex items-center gap-1.5 text-small font-medium', status.className)}>
          <StatusIcon aria-hidden className="size-4 shrink-0" />
          <span>{t(status.label)}</span>
        </span>
      </DataTableCell>

      <DataTableCell className="flex items-center gap-1.5 text-small text-text-muted">
        <CalendarClock aria-hidden className="size-4 shrink-0 text-text-muted" />
        <span>{item.dueAt ? t('dueAt', { date: formatDateTime(item.dueAt) }) : t('due.none')}</span>
      </DataTableCell>

      <DataTableCell className="flex items-center gap-1.5 text-small tabular-nums text-text-muted">
        <Users aria-hidden className="size-4 shrink-0 text-text-muted" />
        <span>
          {t('assignments.submittedCount', {
            submitted: item.submittedCount,
            total: item.memberCount,
          })}
        </span>
      </DataTableCell>

      <DataTableCell align="right" className="relative z-10 flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('assignments.cancelLabel', { title: item.setTitle })}
          onClick={() => setConfirming(true)}
        >
          <Trash2 aria-hidden className="size-5" />
        </Button>
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title={t('assignments.cancelTitle', { title: item.setTitle })}
          description={t('assignments.cancelDescription')}
          confirmLabel={t('assignments.cancel')}
          cancelLabel={t('assignments.keep')}
          pending={remove.isPending}
          error={remove.error ? formErrorMessage(remove.error) : null}
          onConfirm={() =>
            remove.mutate(undefined, {
              onSuccess: async () => {
                await queryClient.invalidateQueries({ queryKey: classKeys.assignments(classId) });
                setConfirming(false);
                toast.success(t('assignments.cancelled'));
              },
            })
          }
        />
        <ChevronRight aria-hidden className="size-4 shrink-0 text-text-muted" />
      </DataTableCell>
    </DataTableRow>
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
  const { t } = useTranslation('classes');
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
      <LoadingState label={t('assignments.loading')}>
        <Skeleton className="h-16 w-full" />
      </LoadingState>
    );
  } else if (assignments.isError) {
    body = (
      <ErrorState
        title={t('assignments.failed')}
        description={t('checkNetwork')}
        onRetry={() => void assignments.refetch()}
      />
    );
  } else if (assignments.data.data.length === 0) {
    if (view.q) {
      body = (
        <ListNoMatch
          text={t('assignments.noMatch', { q: view.q })}
          clearHref={hrefFor({ ...view, q: '', page: 1 })}
        />
      );
    } else if (view.status === 'all') {
      body = <EmptyState title={t('assignments.empty')} description={t('assignments.emptyHint')} />;
    } else {
      body = (
        <p className="py-6 text-text-muted">
          {t(view.status === 'open' ? 'assignments.noOpen' : 'assignments.noClosed')}
        </p>
      );
    }
  } else {
    body = (
      <DataTableContainer minWidth="min-w-[900px]">
        <DataTableHeader
          gridTemplateColumns={ASSIGNMENT_GRID}
          columns={[
            { label: t('assignments.colSetTitle') },
            { label: t('assignments.colMode') },
            { label: t('assignments.colStatus') },
            { label: t('assignments.colDue') },
            { label: t('assignments.colSubmitted') },
            { label: t('assignments.colAction'), align: 'right' },
          ]}
        />
        <ul aria-label={t('assignments.title')} className="flex flex-col">
          {assignments.data.data.map((item) => (
            <TeacherAssignmentRow key={item.id} classId={classId} item={item} now={now} />
          ))}
        </ul>
      </DataTableContainer>
    );
  }

  return (
    <ListPanel
      title={t('assignments.title')}
      count={assignments.data?.meta.total}
      actions={
        archived ? null : (
          <Button onClick={() => setAssigning(true)}>
            <ClipboardList aria-hidden className="size-4" />
            {t('assign.title')}
          </Button>
        )
      }
      toolbar={
        <ListToolbar
          key={view.q}
          tabs={ASSIGNMENT_WINDOWS.map((status) => ({
            label: t(`assignments.${status}`),
            href: hrefFor({ ...view, status, page: 1 }),
            current: view.status === status,
            count: assignments.data?.counts[status],
          }))}
          search={{ label: t('searchSet'), value: view.q, onSearch: (q) => go({ q }) }}
          filters={
            <ListFilter>
              <Select
                aria-label={t('assignments.sort')}
                value={view.sort}
                onChange={(event) => go({ sort: event.target.value as AssignmentSort })}
              >
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {t(label)}
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
