'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createClassSchema,
  paginationSchema,
  type Class,
  type CreateClassInput,
} from '@vocab/shared';
import { Plus, Users } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { FormField, TextareaField } from '@/components/common/form-field';
import { FormError } from '@/components/common/form-message';
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

function CreateClassForm({ onCancel }: { onCancel: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const create = useMutation({ mutationFn: createClass });
  const form = useForm<CreateClassForm, unknown, CreateClassInput>({
    resolver: zodResolver(createClassSchema),
    defaultValues: { name: '', description: '' },
  });
  const { errors } = form.formState;

  const submit = form.handleSubmit(async (dto) => {
    try {
      // Mô tả trống thành `null` sau khi qua schema, API tạo lớp chỉ nhận chuỗi nên bỏ hẳn trường.
      const created = await create.mutateAsync(dto.description ? dto : { name: dto.name });
      await queryClient.invalidateQueries({ queryKey: classKeys.all });
      toast.success(`Đã tạo lớp ${created.name}`);
      router.push(`/classes/${created.id}` as Route);
    } catch {
      // Lỗi hiện qua `create.error`.
    }
  });

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-labelledby="create-class-title"
      className="flex flex-col gap-4 rounded-md border border-border-strong bg-surface p-4"
    >
      <h2 id="create-class-title" className="text-h3">
        Lớp mới
      </h2>
      {create.error ? <FormError>{formErrorMessage(create.error)}</FormError> : null}
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
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={create.isPending}>
          Tạo lớp
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Huỷ
        </Button>
      </div>
    </form>
  );
}

function ClassRow({ item }: { item: Class }) {
  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        href={`/classes/${item.id}` as Route}
        className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 transition-colors duration-fast ease-standard hover:bg-primary-soft sm:px-2"
      >
        <span className="flex min-w-0 flex-col">
          <span className="font-medium wrap-anywhere">{item.name}</span>
          {item.description ? (
            <span className="line-clamp-1 text-small text-text-muted">{item.description}</span>
          ) : null}
        </span>
        <span className="flex items-center gap-4 text-small text-text-muted">
          <span className="flex items-center gap-1 tabular-nums">
            <Users aria-hidden className="size-4" />
            {item.memberCount} học sinh
          </span>
          <span className="rounded-sm bg-primary-soft px-2 font-mono tracking-wider text-primary">
            <span className="sr-only">Mã lớp </span>
            {item.joinCode}
          </span>
        </span>
      </Link>
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
      <ul aria-label={archived ? 'Lớp đã lưu trữ' : 'Lớp đang dạy'} className="flex flex-col">
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
          creating ? null : (
            <Button onClick={() => setCreating(true)}>
              <Plus aria-hidden className="size-4" />
              Tạo lớp
            </Button>
          )
        }
      />
      {creating ? <CreateClassForm onCancel={() => setCreating(false)} /> : null}
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
