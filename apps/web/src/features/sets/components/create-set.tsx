'use client';

import type { SetFormValues } from '@vocab/shared';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCreateSet } from '../hooks/use-set-editor';
import { EMPTY_SET_FORM, SetForm } from './set-form';

export function CreateSet() {
  const router = useRouter();
  const createSet = useCreateSet();

  const save = async ({ description, ...values }: SetFormValues) => {
    await createSet.mutateAsync({ ...values, description: description || undefined });
    toast.success('Đã lưu bộ từ');
    router.push('/sets');
  };

  return <SetForm defaultValues={EMPTY_SET_FORM} onSubmit={save} />;
}
