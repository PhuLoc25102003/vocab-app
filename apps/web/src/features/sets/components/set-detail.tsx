'use client';

import type { SetDetail as SetDetailData } from '@vocab/shared';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { LoadingState } from '@/components/common/loading-state';
import { PageHeader } from '@/components/common/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useSet } from '../hooks/use-set';
import { VISIBILITY_LABELS } from '../labels';
import { CardList } from './card-list';
import { SetLoadFailure } from './set-load-failure';

interface SetDetailProps {
  id: string;
  /** Nút theo quyền của người xem, do tầng trang ghép vào. */
  renderActions: (set: SetDetailData) => ReactNode;
}

export function SetDetail({ id, renderActions }: SetDetailProps) {
  const set = useSet(id);

  if (set.isPending) {
    return (
      <LoadingState label="Đang tải bộ từ">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-64 max-w-full" />
          <Skeleton className="h-6 w-48 max-w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </LoadingState>
    );
  }
  if (set.isError) {
    return <SetLoadFailure error={set.error} onRetry={() => void set.refetch()} />;
  }

  const { title, description, visibility, cardCount, owner, cards, termLang, defLang } = set.data;

  return (
    <>
      <PageHeader
        title={title}
        description={description ?? undefined}
        actions={renderActions(set.data)}
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-text-muted">
        <span className="rounded-sm bg-primary-soft px-2 text-tiny text-primary">
          {VISIBILITY_LABELS[visibility]}
        </span>
        <span className="tabular-nums">{cardCount} thẻ</span>
        <span>Tạo bởi {owner.displayName}</span>
      </div>
      {cards.length > 0 ? (
        <CardList cards={cards} termLang={termLang} defLang={defLang} />
      ) : (
        <EmptyState title="Bộ từ này chưa có thẻ" description="Thẻ được thêm sẽ hiện ở đây." />
      )}
    </>
  );
}
