'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  setFormSchema,
  type CardDraft,
  type ImportRow,
  type SetFormInput,
  type SetFormValues,
} from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { FormError } from '@/components/common/form-message';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { HttpError } from '@/lib/http';
import { useUnsavedGuard } from '@/components/common/use-unsaved-guard';
import { CardFields, EMPTY_CARD } from '@/features/sets/components/card-fields';
import { SetForm } from '@/features/sets/components/set-form';
import { getImportTarget, importAsNewSet, importIntoSet } from '../api';
import { ImportSource, type ImportExtraColumns } from './import-source';
import { useTranslation } from 'react-i18next';

// Danh sách bộ từ dùng khoá bắt đầu bằng 'sets', làm mới để thấy số thẻ mới.
const SETS_QUERY_KEY = ['sets'] as const;

interface ImportIntoSetProps {
  setId: string;
  targetNote: React.ReactNode;
  initialCards: CardDraft[];
  onRestart: () => void;
}

function ImportIntoSet({ setId, targetNote, initialCards, onRestart }: ImportIntoSetProps) {
  const { t } = useTranslation('sets');
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setFocus,
    trigger,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SetFormInput, unknown, SetFormValues>({
    resolver: zodResolver(setFormSchema),
    defaultValues: {
      title: 'Import',
      description: '',
      termLang: 'en',
      defLang: 'vi',
      visibility: 'PRIVATE',
      cards: initialCards.length > 0 ? initialCards : [EMPTY_CARD, EMPTY_CARD],
    },
  });

  const guard = useUnsavedGuard(isDirty);

  useEffect(() => {
    void trigger();
  }, [trigger]);

  const submit = handleSubmit(async (values) => {
    try {
      setServerError(null);
      const cards = values.cards.map(({ id: _id, ...card }) => card);
      await importIntoSet(setId, cards);
      await queryClient.invalidateQueries({ queryKey: SETS_QUERY_KEY });
      toast.success(t('import.imported', { count: cards.length }));
      await guard.release();
      router.replace(`/sets/${setId}` as Route);
    } catch (error) {
      setServerError(formErrorMessage(error));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex w-full flex-col gap-6">
      {guard.dialog}
      {targetNote}
      {serverError ? <FormError>{serverError}</FormError> : null}
      <CardFields control={control} register={register} setFocus={setFocus} errors={errors.cards} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={isSubmitting}>
          {t('import.saveCount', { count: initialCards.length })}
        </Button>
        <Button type="button" variant="secondary" onClick={onRestart}>
          {t('import.restart')}
        </Button>
        <Button asChild variant="secondary">
          <Link href={`/sets/${setId}` as Route}>{t('form.cancel')}</Link>
        </Button>
      </div>
    </form>
  );
}

interface ImportWizardProps {
  /** Có thì thêm thẻ vào bộ này, không có thì tạo bộ mới. */
  setId?: string;
}

export function ImportWizard({ setId }: ImportWizardProps) {
  const { t } = useTranslation('sets');
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [suggestedTitle, setSuggestedTitle] = useState('');
  const [_columns, setColumns] = useState<ImportExtraColumns>({
    phonetic: true,
    example: true,
    image: false,
  });
  const hasMounted = useRef(false);
  const target = useQuery({
    queryKey: [...SETS_QUERY_KEY, 'import-target', setId],
    queryFn: () => getImportTarget(setId ?? ''),
    enabled: Boolean(setId),
  });

  // Next giữ trang đã rời ở trạng thái ẩn, nên mở lại thì bắt đầu từ đầu.
  useEffect(() => {
    if (hasMounted.current) {
      setRows(null);
      setSuggestedTitle('');
    }
    hasMounted.current = true;
  }, []);

  if (setId && target.isPending) {
    return (
      <LoadingState label={t('loading')}>
        <Skeleton className="h-48 w-full" />
      </LoadingState>
    );
  }
  if (setId && target.isError) {
    const notFound = target.error instanceof HttpError && target.error.status === 404;
    return (
      <ErrorState
        title={t(notFound ? 'failure.notFound' : 'loadFailed')}
        description={notFound ? t('import.targetNotFound') : t('checkNetwork')}
        onRetry={notFound ? undefined : () => void target.refetch()}
      />
    );
  }

  const targetNote = target.data ? (
    <p className="max-w-[65ch] text-text-muted wrap-anywhere">
      {t('import.targetNote', { title: target.data.title, count: target.data.cardCount })}
    </p>
  ) : null;

  if (!rows) {
    return (
      <div className="flex flex-col gap-6">
        {targetNote}
        <ImportSource
          onPreview={(result, chosen, suggested) => {
            setColumns(chosen);
            setRows(result.rows);
            if (suggested) {
              setSuggestedTitle(suggested);
            }
          }}
        />
      </div>
    );
  }

  const restart = () => {
    setRows(null);
    setSuggestedTitle('');
  };

  if (rows.length === 0) {
    return (
      <EmptyState
        title={t('import.noRows')}
        description={t('import.noRowsHint')}
        action={<Button onClick={restart}>{t('import.restart')}</Button>}
      />
    );
  }

  const initialCards: CardDraft[] = rows.map((r) => ({
    term: r.term,
    definition: r.definition,
    phonetic: r.phonetic ?? '',
    example: r.example ?? '',
    imageUrl: r.imageUrl?.trim() || undefined,
  }));

  if (setId) {
    return (
      <ImportIntoSet
        setId={setId}
        targetNote={targetNote}
        initialCards={initialCards}
        onRestart={restart}
      />
    );
  }

  return (
    <SetForm
      cancelHref="/sets"
      defaultValues={{
        title: suggestedTitle,
        description: '',
        termLang: 'en',
        defLang: 'vi',
        visibility: 'PRIVATE',
        cards: initialCards.length > 0 ? initialCards : [EMPTY_CARD, EMPTY_CARD],
      }}
      onRestart={restart}
      submitLabel={t('import.saveCount', { count: rows.length })}
      onSubmit={async (values) => {
        const id = await importAsNewSet({
          title: values.title,
          visibility: values.visibility,
          cards: values.cards.map(({ id: _id, ...card }) => card),
        });
        await queryClient.invalidateQueries({ queryKey: SETS_QUERY_KEY });
        toast.success(t('import.imported', { count: values.cards.length }));
        return `/sets/${id}` as Route;
      }}
    />
  );
}
