'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Combobox, type ComboboxOption } from '@/components/common/combobox';
import { ErrorState } from '@/components/common/error-state';
import { FormDialog } from '@/components/common/form-dialog';
import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { adminKeys, assignStudentToClass, getAdminClassesOverview } from '../api';

interface AssignClassDialogProps {
  student: { id: string; displayName: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** ADMIN chọn một lớp đang hoạt động để xếp học sinh vào, không cần mã tham gia. */
export function AssignClassDialog({ student, open, onOpenChange }: AssignClassDialogProps) {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState('');
  const [touched, setTouched] = useState(false);
  const overview = useQuery({
    queryKey: adminKeys.classesOverview,
    queryFn: getAdminClassesOverview,
    enabled: open,
  });

  const assign = useMutation({
    mutationFn: (id: string) => assignStudentToClass(id, student.id),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.classesOverview }),
        queryClient.invalidateQueries({ queryKey: adminKeys.users }),
        queryClient.invalidateQueries({ queryKey: adminKeys.stats }),
      ]);
      const values = { name: result.displayName, className: result.className };
      if (result.alreadyMember) toast.info(t('assignClass.already', values));
      else toast.success(t('assignClass.done', values));
      close(false);
    },
  });

  const close = (next: boolean) => {
    if (!next) {
      setClassId('');
      setTouched(false);
      assign.reset();
    }
    onOpenChange(next);
  };

  // Lớp đang hoạt động mà học sinh chưa ở trong đó.
  const options: ComboboxOption[] = (overview.data?.classes ?? [])
    .filter(
      (klass) => !klass.archivedAt && !klass.members.some((member) => member.id === student.id),
    )
    .map((klass) => ({
      value: klass.id,
      label: klass.name,
      description: t('assignClass.classOption', {
        teacher: klass.teacher?.displayName ?? '—',
        count: klass.memberCount,
      }),
    }));

  const missing = touched && !classId;

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title={t('assignClass.title', { name: student.displayName })}
      description={t('assignClass.description')}
      submitLabel={t('assignClass.submit')}
      pending={assign.isPending}
      error={assign.isError ? formErrorMessage(assign.error) : null}
      dirty={Boolean(classId)}
      onSubmit={(event) => {
        event.preventDefault();
        setTouched(true);
        if (classId) assign.mutate(classId);
      }}
    >
      {overview.isPending ? (
        <LoadingState label={t('assignClass.loading')}>
          <Skeleton className="h-11 w-full" />
        </LoadingState>
      ) : overview.isError ? (
        <ErrorState
          title={t('assignClass.failed')}
          description={t('checkNetwork')}
          onRetry={() => void overview.refetch()}
        />
      ) : options.length === 0 ? (
        <p className="text-small text-text-muted">{t('assignClass.noClasses')}</p>
      ) : (
        // Thân hộp thoại cuộn được nên danh sách thả xuống bị cắt; chừa đủ chỗ cho danh sách cao tối đa.
        <div className="min-h-84">
          <Combobox
            label={t('assignClass.field')}
            options={options}
            value={classId}
            onChange={(value) => {
              setClassId(value);
              setTouched(true);
            }}
            placeholder={t('assignClass.placeholder')}
            emptyText={t('assignClass.empty')}
            error={missing ? t('assignClass.required') : undefined}
          />
        </div>
      )}
    </FormDialog>
  );
}
