'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createClassSchema,
  paginationSchema,
  type ClassListItem,
  type CreateClassInput,
} from '@vocab/shared';
import { ChevronRight, Copy, Plus, Users } from 'lucide-react';
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
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { classKeys, createClass, listClasses, CLASSES_PAGE_SIZE } from '../api';

type CreateClassForm = { name: string; description?: string };

function classesHref(archived: boolean, page = 1): Route {
  const params = new URLSearchParams();
  if (archived) params.set('archived', '1');
  if (page > 1) params.set('page', String(page));
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
      toast.success(`Đã tạo lớp ${created.name}`);
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
      title="Tạo lớp"
      description="Tạo xong bạn sẽ có mã lớp để gửi cho học sinh."
      submitLabel="Tạo lớp"
      pending={create.isPending}
      error={create.error ? formErrorMessage(create.error) : null}
      dirty={isDirty}
      onSubmit={(event) => void submit(event)}
    >
      <FormField
        label="Tên lớp"
        placeholder="Ví dụ: 10A1 - Tiếng Anh"
        error={errors.name?.message}
        {...form.register('name')}
      />
      <TextareaField
        label="Mô tả (không bắt buộc)"
        rows={2}
        error={errors.description?.message}
        {...form.register('description')}
      />
    </FormDialog>
  );
}

function CopyCodeButton({ code }: { code: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Đã sao chép mã ${code}`);
    } catch {
      toast.error('Không sao chép được, hãy chép mã bằng tay');
    }
  };
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`Sao chép mã lớp ${code}`}
      onClick={() => void copy()}
      className="relative z-10"
    >
      <Copy aria-hidden className="size-4" />
    </Button>
  );
}

/** Thẻ hàng: cả thẻ mở trang lớp, riêng nút sao chép mã nằm trên lớp link. */
function ClassRow({ item }: { item: ClassListItem }) {
  const initial = item.name.trim().charAt(0).toLocaleUpperCase('vi') || '?';
  return (
    <li className="relative flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border-strong bg-surface p-3 transition-colors duration-fast ease-standard hover:border-primary sm:p-4">
      <span
        aria-hidden
        className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-soft font-semibold text-primary"
      >
        {initial}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <Link
          href={`/classes/${item.id}` as Route}
          className="flex min-h-11 items-center font-semibold wrap-anywhere after:absolute after:inset-0 after:rounded-lg"
        >
          {item.name}
        </Link>
        {item.description ? (
          <span className="line-clamp-1 text-small text-text-muted">{item.description}</span>
        ) : null}
      </span>
      <span className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 text-small text-text-muted sm:w-auto">
        <span className="flex items-center gap-1 tabular-nums">
          <Users aria-hidden className="size-4" />
          {item.memberCount} HS
        </span>
        <span className="tabular-nums">{item.openAssignmentCount} bài mở</span>
        <span className="flex min-w-32 items-center gap-2">
          {item.onTimeRate === null ? (
            <span>Chưa có bài hết hạn</span>
          ) : (
            <>
              <span
                role="meter"
                aria-label="Tỉ lệ nộp đúng hạn 30 ngày"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={item.onTimeRate}
                className="h-1.5 w-16 overflow-hidden rounded-full bg-border"
              >
                <span
                  className="block h-full bg-primary"
                  style={{ width: `${item.onTimeRate}%` }}
                />
              </span>
              <span className="tabular-nums">{item.onTimeRate}% đúng hạn</span>
            </>
          )}
        </span>
        <span className="flex items-center">
          <span className="rounded-sm bg-primary-soft px-2 font-mono tracking-wider text-primary">
            <span className="sr-only">Mã lớp </span>
            {item.joinCode}
          </span>
          <CopyCodeButton code={item.joinCode} />
        </span>
      </span>
      <ChevronRight aria-hidden className="hidden size-5 shrink-0 text-text-muted sm:block" />
    </li>
  );
}

function ClassesLoading() {
  return (
    <LoadingState label="Đang tải lớp học">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </LoadingState>
  );
}

function ClassList({ archived, page }: { archived: boolean; page: number }) {
  const classes = useQuery({
    queryKey: classKeys.list(archived, page),
    queryFn: () => listClasses(archived, page),
  });

  if (classes.isPending) return <ClassesLoading />;
  if (classes.isError) {
    return (
      <ErrorState
        title="Không tải được lớp học"
        description="Kiểm tra kết nối mạng rồi thử lại."
        onRetry={() => void classes.refetch()}
      />
    );
  }
  const { data, meta } = classes.data;
  if (data.length === 0) {
    return archived ? (
      <EmptyState title="Chưa có lớp nào đã lưu trữ" description="Lớp bạn lưu trữ sẽ nằm ở đây." />
    ) : (
      <EmptyState
        title="Bạn chưa có lớp nào"
        description="Tạo lớp rồi gửi mã lớp cho học sinh để các em tham gia."
      />
    );
  }
  return (
    <>
      <ul aria-label={archived ? 'Lớp đã lưu trữ' : 'Lớp đang dạy'} className="flex flex-col gap-2">
        {data.map((item) => (
          <ClassRow key={item.id} item={item} />
        ))}
      </ul>
      <Pagination
        page={meta.page}
        pageCount={Math.ceil(meta.total / CLASSES_PAGE_SIZE)}
        hrefFor={(next) => classesHref(archived, next)}
      />
    </>
  );
}

function FilterLink({
  href,
  current,
  children,
}: {
  href: Route;
  current: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      className="inline-flex min-h-11 items-center rounded-md px-3 font-medium text-text-muted transition-colors duration-fast ease-standard hover:bg-primary-soft aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary"
    >
      {children}
    </Link>
  );
}

export function TeacherClasses() {
  const searchParams = useSearchParams();
  const archived = searchParams.get('archived') === '1';
  const page = paginationSchema.shape.page.catch(1).parse(searchParams.get('page') ?? undefined);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title="Lớp học"
        description="Lớp bạn đang dạy. Học sinh tham gia bằng mã lớp."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden className="size-4" />
            Tạo lớp
          </Button>
        }
      />
      <CreateClassDialog open={creating} onOpenChange={setCreating} />
      <nav aria-label="Lọc lớp" className="flex gap-1">
        <FilterLink href={classesHref(false)} current={!archived}>
          Đang dạy
        </FilterLink>
        <FilterLink href={classesHref(true)} current={archived}>
          Đã lưu trữ
        </FilterLink>
      </nav>
      <ClassList archived={archived} page={page} />
    </>
  );
}

export { ClassesLoading };
