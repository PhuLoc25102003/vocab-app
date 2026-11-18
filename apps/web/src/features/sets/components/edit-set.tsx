'use client';

import { ERROR_CODES, type Card, type CardDraft, type SetFormValues } from '@vocab/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { HttpError } from '@/lib/http';
import { useEditableSet, useSaveSet } from '../hooks/use-set-editor';
import { EMPTY_CARD } from './card-fields';
import { SetForm } from './set-form';

function toCardDraft({ id, term, definition, phonetic, example }: Card): CardDraft {
  return { id, term, definition, phonetic: phonetic ?? '', example: example ?? '' };
}

export function EditSet({ id }: { id: string }) {
  const router = useRouter();
  const set = useEditableSet(id);
  const saveSet = useSaveSet(id);

  if (set.isPending) {
    return (
      <LoadingState label="Đang tải bộ từ">
        <div className="flex max-w-[720px] flex-col gap-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </LoadingState>
    );
  }
  if (set.isError) {
    if (set.error instanceof HttpError && set.error.code === ERROR_CODES.SET_NOT_FOUND) {
      return (
        <EmptyState
          title="Không tìm thấy bộ từ"
          description="Bộ từ này đã bị xoá hoặc bạn không có quyền xem."
          action={
            <Button asChild variant="secondary">
              <Link href="/sets">Về danh sách bộ từ</Link>
            </Button>
          }
        />
      );
    }
    return (
      <ErrorState
        title="Không tải được bộ từ"
        description="Hãy kiểm tra mạng rồi thử lại."
        onRetry={() => void set.refetch()}
      />
    );
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
    router.push('/sets');
  };

  return (
    <SetForm
      // Next giữ trang cũ ẩn trong DOM, dữ liệu mới phải tạo lại form.
      key={updatedAt}
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
