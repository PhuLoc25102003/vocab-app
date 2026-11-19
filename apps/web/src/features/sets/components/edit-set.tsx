'use client';

import type { Card, CardDraft, SetFormValues } from '@vocab/shared';
import type { Route } from 'next';
import { toast } from 'sonner';
import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useEditableSet, useSaveSet } from '../hooks/use-set-editor';
import { EMPTY_CARD } from './card-fields';
import { SetForm } from './set-form';
import { SetLoadFailure } from './set-load-failure';

function toCardDraft({ id, term, definition, phonetic, example }: Card): CardDraft {
  return { id, term, definition, phonetic: phonetic ?? '', example: example ?? '' };
}

export function EditSet({ id }: { id: string }) {
  const set = useEditableSet(id);
  const saveSet = useSaveSet(id);
  const detailHref = `/sets/${id}` as Route;

  if (set.isPending) {
    return (
      <LoadingState label="Đang tải bộ từ">
        <div className="flex w-full flex-col gap-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </LoadingState>
    );
  }
  if (set.isError) {
    return <SetLoadFailure error={set.error} onRetry={() => void set.refetch()} />;
  }

  const { title, description, termLang, defLang, visibility, updatedAt, cards } = set.data;

  const save = async ({
    description: nextDescription,
    cards: nextCards,
    ...rest
  }: SetFormValues) => {
    await saveSet.mutateAsync({
      details: { ...rest, description: nextDescription || null },
      cards: nextCards,
    });
    toast.success('Đã lưu bộ từ');
    return detailHref;
  };

  return (
    <SetForm
      // Next giữ trang cũ ẩn trong DOM, dữ liệu mới phải tạo lại form.
      key={updatedAt}
      cancelHref={detailHref}
      defaultValues={{
        title,
        description: description ?? '',
        termLang,
        defLang,
        visibility,
        cards: cards.length > 0 ? cards.map(toCardDraft) : [EMPTY_CARD],
      }}
      onSubmit={save}
    />
  );
}
