'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ASSIGNMENT_GROUPS,
  type AssignmentGroup,
  assignmentGroupSchema,
  ERROR_CODES,
  joinClassSchema,
  JOIN_CODE_LENGTH,
  type JoinClassInput,
  type JoinedClass,
  LIST_SEARCH_MAX_LENGTH,
  type MyAssignment,
  myAssignmentListQuerySchema,
  paginationSchema,
} from '@vocab/shared';
import { CalendarClock, LogIn, LogOut } from 'lucide-react';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
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
import {
  ListFilter,
  ListNoMatch,
  ListPager,
  ListPanel,
  ListToolbar,
} from '@/components/common/list-panel';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { HttpError } from '@/lib/http';
import {
  classKeys,
  JOINED_PAGE_SIZE,
  joinClass,
  leaveClass,
  listJoinedClasses,
  listMyAssignments,
  MY_ASSIGNMENTS_PAGE_SIZE,
  type MyAssignmentFilter,
} from '../api';
import { formatDateTime } from '../format';
import { AssignmentRow } from './assignment-row';
import { PROGRESS_STATUS } from './status-label';
import { useTranslation } from 'react-i18next';

const CLASS_OPTIONS_LIMIT = 100;

const assignmentHref = ({ id }: MyAssignment) => `/classes/assignments/${id}` as Route;

function JoinDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('classes');
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
        toast.success(t('student.joined', { name: joined.name }));
        close(false);
      },
      onError: (error) => {
        const message =
          error instanceof HttpError && error.code === ERROR_CODES.CLASS_NOT_FOUND
            ? t('student.codeNotFound')
            : formErrorMessage(error);
        form.setError('joinCode', { message });
      },
    }),
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title={t('student.joinTitle')}
      description={t('student.joinDescription', { length: JOIN_CODE_LENGTH })}
      submitLabel={t('student.join')}
      pending={join.isPending}
      dirty={form.formState.isDirty}
      onSubmit={(event) => void submit(event)}
    >
      <FormField
        label={t('student.code')}
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

function MyAssignmentRow({ item }: { item: MyAssignment }) {
  const { t } = useTranslation(['classes', 'common']);
  return (
    <AssignmentRow
      href={assignmentHref(item)}
      status={{
        ...PROGRESS_STATUS[item.progressStatus],
        label: t(PROGRESS_STATUS[item.progressStatus].label),
      }}
      title={item.setTitle}
    >
      <span>{item.className}</span>
      <span className="rounded-sm bg-primary-soft px-2 text-tiny text-primary">
        {t(`common:modes.${item.mode}`)}
        {item.modes.length > 1 ? ` +${item.modes.length - 1}` : ''}
      </span>
      {item.modes.length > 1 ? (
        <span className="tabular-nums">
          {t('work.modes', { done: item.doneModes, total: item.modes.length })}
        </span>
      ) : null}
      {item.dueAt ? (
        <span className="flex items-center gap-1">
          <CalendarClock aria-hidden className="size-4" />
          {t('dueAt', { date: formatDateTime(item.dueAt) })}
        </span>
      ) : null}
    </AssignmentRow>
  );
}

type AssignmentSort = NonNullable<MyAssignmentFilter['sort']>;

const SORT_LABELS = {
  due: 'sort.due',
  '-createdAt': 'sort.created',
} as const satisfies Record<AssignmentSort, string>;

/** Bộ lọc của trang `/classes`, nằm trong URL để nút quay lại về đúng chỗ. */
interface ClassesView {
  group: AssignmentGroup;
  classId: string;
  q: string;
  sort: AssignmentSort;
  bpage: number;
  cq: string;
  cpage: number;
}

function readView(searchParams: { get: (key: string) => string | null }): ClassesView {
  const page = (key: string) =>
    paginationSchema.shape.page.catch(1).parse(searchParams.get(key) ?? undefined);
  const text = (key: string) => (searchParams.get(key) ?? '').slice(0, LIST_SEARCH_MAX_LENGTH);
  return {
    group: assignmentGroupSchema.catch('todo').parse(searchParams.get('group') ?? 'todo'),
    classId: text('class'),
    q: text('q'),
    sort: myAssignmentListQuerySchema.shape.sort.parse(searchParams.get('sort') ?? undefined),
    bpage: page('bpage'),
    cq: text('cq'),
    cpage: page('cpage'),
  };
}

function viewHref(view: ClassesView): Route {
  const params = new URLSearchParams();
  if (view.group !== 'todo') params.set('group', view.group);
  if (view.classId) params.set('class', view.classId);
  if (view.q) params.set('q', view.q);
  if (view.sort !== 'due') params.set('sort', view.sort);
  if (view.bpage > 1) params.set('bpage', String(view.bpage));
  if (view.cq) params.set('cq', view.cq);
  if (view.cpage > 1) params.set('cpage', String(view.cpage));
  const query = params.toString();
  return (query ? `/classes?${query}` : '/classes') as Route;
}

function MyAssignments({ view }: { view: ClassesView }) {
  const { t } = useTranslation('classes');
  const router = useRouter();
  const go = (patch: Partial<ClassesView>) =>
    router.push(viewHref({ ...view, bpage: 1, ...patch }));
  const filter: MyAssignmentFilter = {
    group: view.group,
    classId: view.classId || undefined,
    q: view.q || undefined,
    sort: view.sort,
  };
  const assignments = useQuery({
    queryKey: classKeys.myAssignmentsQuery(view.bpage, filter),
    queryFn: () => listMyAssignments(view.bpage, filter),
  });
  // Ô lọc lớp lấy tối đa 100 lớp đã tham gia, đủ cho một học sinh.
  const classes = useQuery({
    queryKey: classKeys.joinedQuery(1, '', CLASS_OPTIONS_LIMIT),
    queryFn: () => listJoinedClasses(1, { limit: CLASS_OPTIONS_LIMIT }),
  });
  const filtered = Boolean(view.classId || view.q);
  const counts = assignments.data?.counts;

  let body;
  if (assignments.isPending) {
    body = (
      <LoadingState label={t('student.loading')}>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </LoadingState>
    );
  } else if (assignments.isError) {
    body = (
      <ErrorState
        title={t('student.failed')}
        description={t('checkNetwork')}
        onRetry={() => void assignments.refetch()}
      />
    );
  } else if (assignments.data.data.length === 0) {
    body = filtered ? (
      <ListNoMatch
        text={t('student.noMatch')}
        clearHref={viewHref({ ...view, classId: '', q: '', bpage: 1 })}
      />
    ) : (
      <EmptyState
        title={t(`student.empty.${view.group}.title`)}
        description={t(`student.empty.${view.group}.description`)}
      />
    );
  } else {
    body = (
      <ul
        aria-label={t('student.list', { group: t(`student.groups.${view.group}`) })}
        className="flex flex-col"
      >
        {assignments.data.data.map((item) => (
          <MyAssignmentRow key={item.id} item={item} />
        ))}
      </ul>
    );
  }

  return (
    <ListPanel
      title={t('student.title')}
      count={assignments.data?.meta.total}
      toolbar={
        <ListToolbar
          key={view.q}
          tabs={ASSIGNMENT_GROUPS.map((group) => ({
            label: t(`student.groups.${group}`),
            href: viewHref({ ...view, group, bpage: 1 }),
            current: view.group === group,
            count: counts?.[group],
          }))}
          search={{ label: t('searchSet'), value: view.q, onSearch: (q) => go({ q }) }}
          filters={
            <>
              <ListFilter wide>
                <Select
                  aria-label={t('student.filterClass')}
                  value={view.classId}
                  onChange={(event) => go({ classId: event.target.value })}
                >
                  <option value="">{t('student.allClasses')}</option>
                  {classes.data?.data.map((klass) => (
                    <option key={klass.id} value={klass.id}>
                      {klass.name}
                    </option>
                  ))}
                </Select>
              </ListFilter>
              <ListFilter>
                <Select
                  aria-label={t('student.sort')}
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
            </>
          }
        />
      }
      footer={
        assignments.data && assignments.data.meta.total > 0 ? (
          <ListPager
            page={assignments.data.meta.page}
            pageSize={MY_ASSIGNMENTS_PAGE_SIZE}
            total={assignments.data.meta.total}
            hrefFor={(bpage) => viewHref({ ...view, bpage })}
          />
        ) : null
      }
    >
      {body}
    </ListPanel>
  );
}

function JoinedRow({ item }: { item: JoinedClass }) {
  const { t } = useTranslation('classes');
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const leave = useMutation({ mutationFn: () => leaveClass(item.id) });

  return (
    <li className="flex min-h-16 items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <span className="flex min-w-0 flex-col">
        <span className="font-medium wrap-anywhere">{item.name}</span>
        <span className="text-small wrap-anywhere text-text-muted">
          {t('student.teacher', { name: item.teacherName })}
        </span>
      </span>
      <Button
        variant="ghost"
        aria-label={t('student.leaveLabel', { name: item.name })}
        onClick={() => setConfirming(true)}
      >
        <LogOut aria-hidden className="size-4" />
        {t('student.leave')}
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t('student.leaveTitle', { name: item.name })}
        description={t('student.leaveDescription')}
        confirmLabel={t('student.leave')}
        cancelLabel={t('student.stay')}
        pending={leave.isPending}
        error={leave.error ? formErrorMessage(leave.error) : null}
        onConfirm={() =>
          leave.mutate(undefined, {
            onSuccess: async () => {
              await queryClient.invalidateQueries({ queryKey: classKeys.all });
              setConfirming(false);
              toast.success(t('student.left', { name: item.name }));
            },
          })
        }
      />
    </li>
  );
}

function JoinedClasses({ view }: { view: ClassesView }) {
  const { t } = useTranslation('classes');
  const router = useRouter();
  const joined = useQuery({
    queryKey: classKeys.joinedQuery(view.cpage, view.cq, JOINED_PAGE_SIZE),
    queryFn: () => listJoinedClasses(view.cpage, { q: view.cq || undefined }),
  });

  let body;
  if (joined.isPending) {
    body = (
      <LoadingState label={t('student.joinedLoading')}>
        <Skeleton className="h-16 w-full" />
      </LoadingState>
    );
  } else if (joined.isError) {
    body = (
      <ErrorState
        title={t('student.joinedFailed')}
        description={t('checkNetwork')}
        onRetry={() => void joined.refetch()}
      />
    );
  } else if (joined.data.data.length === 0) {
    body = view.cq ? (
      <ListNoMatch
        text={t('student.joinedNoMatch', { q: view.cq })}
        clearHref={viewHref({ ...view, cq: '', cpage: 1 })}
      />
    ) : (
      <EmptyState title={t('student.noClasses')} description={t('student.noClassesHint')} />
    );
  } else {
    body = (
      <ul aria-label={t('student.joinedTitle')} className="flex flex-col">
        {joined.data.data.map((item) => (
          <JoinedRow key={item.id} item={item} />
        ))}
      </ul>
    );
  }

  return (
    <ListPanel
      title={t('student.joinedTitle')}
      count={joined.data?.meta.total}
      toolbar={
        <ListToolbar
          key={view.cq}
          search={{
            label: t('teacher.search'),
            value: view.cq,
            onSearch: (cq) => router.push(viewHref({ ...view, cq, cpage: 1 })),
          }}
        />
      }
      footer={
        joined.data && joined.data.meta.total > 0 ? (
          <ListPager
            page={joined.data.meta.page}
            pageSize={JOINED_PAGE_SIZE}
            total={joined.data.meta.total}
            hrefFor={(cpage) => viewHref({ ...view, cpage })}
          />
        ) : null
      }
    >
      {body}
    </ListPanel>
  );
}

export function StudentClasses() {
  const { t } = useTranslation('classes');
  const [joining, setJoining] = useState(false);
  const view = readView(useSearchParams());
  return (
    <>
      <PageHeader
        title={t('page.title')}
        description={t('student.pageDescription')}
        actions={
          <Button onClick={() => setJoining(true)}>
            <LogIn aria-hidden className="size-4" />
            {t('student.joinTitle')}
          </Button>
        }
      />
      <JoinDialog open={joining} onOpenChange={setJoining} />
      <MyAssignments view={view} />
      <JoinedClasses view={view} />
    </>
  );
}
