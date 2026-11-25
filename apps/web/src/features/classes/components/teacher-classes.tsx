'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  classListQuerySchema,
  type ClassSort,
  createClassSchema,
  LIST_SEARCH_MAX_LENGTH,
  paginationSchema,
  type ClassListItem,
  type CreateClassInput,
} from '@vocab/shared';
import { ChevronRight, Plus, Users } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { FormDialog } from '@/components/common/form-dialog';
import { FormField, TextareaField } from '@/components/common/form-field';
import { LoadingState } from '@/components/common/loading-state';
import { PageHeader } from '@/components/common/page-header';
import {
  ListFilter,
  ListNoMatch,
  ListPager,
  ListPanel,
  ListToolbar,
} from '@/components/common/list-panel';
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
import { classKeys, createClass, listClasses, CLASSES_PAGE_SIZE } from '../api';
import { useTranslation } from 'react-i18next';

type CreateClassForm = { name: string; description?: string };

/** Bộ lọc danh sách lớp, nằm trong URL (việc 5.33). */
interface ClassesView {
  archived: boolean;
  q: string;
  sort: ClassSort;
  page: number;
}

const SORT_LABELS = {
  '-createdAt': 'teacher.sortCreated',
  name: 'teacher.sortName',
  '-memberCount': 'teacher.sortMembers',
} as const;

function classesHref(view: ClassesView): Route {
  const params = new URLSearchParams();
  if (view.archived) params.set('archived', '1');
  if (view.q) params.set('q', view.q);
  if (view.sort !== '-createdAt') params.set('sort', view.sort);
  if (view.page > 1) params.set('page', String(view.page));
  const query = params.toString();
  return (query ? `/classes?${query}` : '/classes') as Route;
}

export function CreateClassDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('classes');
  const router = useRouter();
  const queryClient = useQueryClient();
  const create = useMutation({ mutationFn: createClass });
  const form = useForm<CreateClassForm, unknown, CreateClassInput>({
    resolver: zodResolver(createClassSchema),
    defaultValues: { name: '', description: '' },
  });
  const { errors, isDirty } = form.formState;

  const close = (next: boolean) => {
    if (!next) {
      form.reset();
      create.reset();
    }
    onOpenChange(next);
  };

  const submit = form.handleSubmit(async (dto) => {
    try {
      // Mô tả trống thành `null` sau khi qua schema, API tạo lớp chỉ nhận chuỗi nên bỏ hẳn trường.
      const created = await create.mutateAsync(dto.description ? dto : { name: dto.name });
      await queryClient.invalidateQueries({ queryKey: classKeys.all });
      toast.success(t('teacher.created', { name: created.name }));
      close(false);
      router.push(`/classes/${created.id}` as Route);
    } catch {
      // Lỗi hiện qua `create.error`.
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title={t('teacher.createTitle')}
      description={t('teacher.createDescription')}
      submitLabel={t('teacher.createTitle')}
      pending={create.isPending}
      error={create.error ? formErrorMessage(create.error) : null}
      dirty={isDirty}
      onSubmit={(event) => void submit(event)}
    >
      <FormField
        label={t('teacher.name')}
        placeholder={t('teacher.namePlaceholder')}
        error={errors.name?.message}
        {...form.register('name')}
      />
      <TextareaField
        label={t('teacher.description')}
        rows={2}
        error={errors.description?.message}
        {...form.register('description')}
      />
    </FormDialog>
  );
}

import { JoinCodeBadge } from './join-code-badge';

const TEACHER_CLASS_GRID =
  'minmax(220px, 1.4fr) minmax(110px, 0.8fr) minmax(160px, 1.1fr) minmax(180px, 1.2fr) minmax(130px, 0.8fr)';

/** Thẻ hàng: cả thẻ mở trang lớp, riêng nút sao chép mã nằm trên lớp link. */
function ClassRow({ item }: { item: ClassListItem }) {
  const { t } = useTranslation('classes');
  const initial = item.name.trim().charAt(0).toLocaleUpperCase('vi') || '?';
  return (
    <DataTableRow
      as="li"
      gridTemplateColumns={TEACHER_CLASS_GRID}
      className="relative items-center gap-4 py-3 hover:bg-primary-soft sm:px-3"
    >
      <DataTableCell className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft font-semibold text-primary"
        >
          {initial}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <Link
            href={`/classes/${item.id}` as Route}
            className="flex min-h-11 items-center font-semibold text-text truncate hover:text-primary hover:underline after:absolute after:inset-0"
            title={item.name}
          >
            {item.name}
          </Link>
          {item.description ? (
            <span className="line-clamp-1 text-small text-text-muted">{item.description}</span>
          ) : null}
        </span>
      </DataTableCell>

      <DataTableCell className="flex items-center gap-1.5 text-small tabular-nums text-text-muted whitespace-nowrap">
        <Users aria-hidden className="size-4 shrink-0 text-text-muted" />
        <span>{t('teacher.members', { count: item.memberCount })}</span>
      </DataTableCell>

      <DataTableCell className="text-small tabular-nums text-text-muted whitespace-nowrap">
        {t('teacher.openCount', { count: item.openAssignmentCount })}
      </DataTableCell>

      <DataTableCell className="flex flex-col gap-1 text-small text-text-muted min-w-0">
        {item.onTimeRate === null ? (
          <span className="truncate">{t('teacher.noClosed')}</span>
        ) : (
          <div className="flex items-center gap-2">
            <span
              role="meter"
              aria-label={t('teacher.onTimeMeter')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={item.onTimeRate}
              className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-border"
            >
              <span className="block h-full bg-primary" style={{ width: `${item.onTimeRate}%` }} />
            </span>
            <span className="tabular-nums font-medium text-text whitespace-nowrap">
              {t('teacher.onTime', { rate: item.onTimeRate })}
            </span>
          </div>
        )}
      </DataTableCell>

      <DataTableCell align="right" className="flex items-center justify-end gap-2 text-small">
        <JoinCodeBadge code={item.joinCode} />
        <ChevronRight aria-hidden className="size-4 shrink-0 text-text-muted" />
      </DataTableCell>
    </DataTableRow>
  );
}

function ClassesLoading() {
  const { t } = useTranslation('classes');
  return (
    <LoadingState label={t('teacher.loading')}>
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </LoadingState>
  );
}

function ClassList({ view }: { view: ClassesView }) {
  const { t } = useTranslation('classes');
  const router = useRouter();
  const go = (patch: Partial<ClassesView>) =>
    router.push(classesHref({ ...view, page: 1, ...patch }));
  const classes = useQuery({
    queryKey: classKeys.list(view.archived, view.page, view.q, view.sort),
    queryFn: () =>
      listClasses(view.archived, view.page, { q: view.q || undefined, sort: view.sort }),
  });
  const total = classes.data?.meta.total;

  let body;
  if (classes.isPending) {
    body = <ClassesLoading />;
  } else if (classes.isError) {
    body = (
      <ErrorState
        title={t('teacher.failed')}
        description={t('checkNetwork')}
        onRetry={() => void classes.refetch()}
      />
    );
  } else if (classes.data.data.length === 0) {
    if (view.q) {
      body = (
        <ListNoMatch
          text={t('teacher.noMatch', { q: view.q })}
          clearHref={classesHref({ ...view, q: '', page: 1 })}
        />
      );
    } else if (view.archived) {
      body = (
        <EmptyState title={t('teacher.noArchived')} description={t('teacher.noArchivedHint')} />
      );
    } else {
      body = <EmptyState title={t('teacher.empty')} description={t('teacher.emptyHint')} />;
    }
  } else {
    body = (
      <DataTableContainer minWidth="min-w-[900px]">
        <DataTableHeader
          gridTemplateColumns={TEACHER_CLASS_GRID}
          columns={[
            { label: t('teacher.colClassName') },
            { label: t('teacher.colStudents') },
            { label: t('teacher.colOpenAssignments') },
            { label: t('teacher.colOnTime') },
            { label: t('teacher.colJoinCode'), align: 'right' },
          ]}
        />
        <ul
          aria-label={t(view.archived ? 'teacher.archived' : 'teacher.active')}
          className="flex flex-col"
        >
          {classes.data.data.map((item) => (
            <ClassRow key={item.id} item={item} />
          ))}
        </ul>
      </DataTableContainer>
    );
  }

  return (
    <ListPanel
      title={t(view.archived ? 'teacher.archived' : 'teacher.active')}
      count={total}
      toolbar={
        <ListToolbar
          key={view.q}
          tabs={[false, true].map((archived) => ({
            label: t(archived ? 'teacher.archivedTab' : 'teacher.activeTab'),
            href: classesHref({ ...view, archived, page: 1 }),
            current: view.archived === archived,
          }))}
          search={{ label: t('teacher.search'), value: view.q, onSearch: (q) => go({ q }) }}
          filters={
            <ListFilter>
              <Select
                aria-label={t('teacher.sort')}
                value={view.sort}
                onChange={(event) => go({ sort: event.target.value as ClassSort })}
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
        classes.data && classes.data.meta.total > 0 ? (
          <ListPager
            page={classes.data.meta.page}
            pageSize={CLASSES_PAGE_SIZE}
            total={classes.data.meta.total}
            hrefFor={(page) => classesHref({ ...view, page })}
          />
        ) : null
      }
    >
      {body}
    </ListPanel>
  );
}

export function TeacherClasses() {
  const { t } = useTranslation('classes');
  const searchParams = useSearchParams();
  const view: ClassesView = {
    archived: searchParams.get('archived') === '1',
    q: (searchParams.get('q') ?? '').slice(0, LIST_SEARCH_MAX_LENGTH),
    sort: classListQuerySchema.shape.sort.parse(searchParams.get('sort') ?? undefined),
    page: paginationSchema.shape.page.catch(1).parse(searchParams.get('page') ?? undefined),
  };
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title={t('page.title')}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden className="size-4" />
            {t('teacher.createTitle')}
          </Button>
        }
      />
      <CreateClassDialog open={creating} onOpenChange={setCreating} />
      <ClassList view={view} />
    </>
  );
}

export { ClassesLoading };
