'use client';

import type { SetFormValues } from '@vocab/shared';
import type { Route } from 'next';
import { toast } from 'sonner';
import { useCreateSet } from '../hooks/use-set-editor';
import { EMPTY_SET_FORM, SetForm } from './set-form';
import { useTranslation } from 'react-i18next';

export function CreateSet() {
  const { t } = useTranslation('sets');
  const createSet = useCreateSet();

  const save = async ({ description, cards, ...details }: SetFormValues) => {
    const created = await createSet.mutateAsync({
      ...details,
      description: description || undefined,
      cards: cards.map(({ id: _id, ...card }) => card),
    });
    toast.success(t('saved'));
    return `/sets/${created.id}` as Route;
  };

  return <SetForm cancelHref="/sets" defaultValues={EMPTY_SET_FORM} onSubmit={save} />;
}
