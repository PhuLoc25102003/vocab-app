'use client';

import type { SetDetail as SetDetailData } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { CopyLinkButton } from '@/components/common/copy-link-button';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { useSet } from '../hooks/use-set';
import { CardList } from './card-list';
import { SetDetailSkeleton } from './set-detail-skeleton';
import { SetLoadFailure } from './set-load-failure';
import { SetMeta } from './set-meta';
import { StudyModeGrid } from './study-mode-grid';

interface SetDetailProps {
  id: string;
  /** Nút theo quyền của người xem, do tầng trang ghép vào. */
  renderActions: (set: SetDetailData) => ReactNode;
  /** Chủ bộ từ và người xem từ Khám phá quay về hai nơi khác nhau. */
  renderBack?: (set: SetDetailData) => ReactNode;
  /** Tiến độ của người xem, hiện khi bộ từ có thẻ. */
  renderProgress?: (set: SetDetailData) => ReactNode;
  /** Thông tin thêm cho từng thẻ, ví dụ mức nhớ. */
  renderCardExtra?: (cardId: string) => ReactNode;
  /** Hành động khi bộ từ chưa có thẻ, theo quyền của người xem. */
  renderEmptyAction?: (set: SetDetailData) => ReactNode;
}

export function SetDetail({
  id,
  renderActions,
  renderBack,
  renderProgress,
  renderCardExtra,
  renderEmptyAction,
}: SetDetailProps) {
  const set = useSet(id);

  if (set.isPending) {
    return <SetDetailSkeleton />;
  }
  if (set.isError) {
    return <SetLoadFailure error={set.error} onRetry={() => void set.refetch()} />;
  }

  const { title, description, visibility, cards, termLang, defLang, hiddenAt, hiddenReason } =
    set.data;

  return (
    <>
      {renderBack?.(set.data)}
      <PageHeader
        title={title}
        description={description ?? undefined}
        actions={renderActions(set.data)}
      />
      {hiddenAt ? (
        <p role="status" className="max-w-[65ch] border-l-4 border-danger-mark pl-3 text-danger">
          Bộ từ đang bị quản trị viên ẩn khỏi người khác. Lý do: {hiddenReason}
        </p>
      ) : null}
      <SetMeta set={set.data}>
        {visibility === 'PUBLIC' ? (
          <>
            <Link
              href={`/public/sets/${id}` as Route}
              className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4"
            >
              Xem trang công khai
            </Link>
            <CopyLinkButton path={`/public/sets/${id}`} />
          </>
        ) : null}
      </SetMeta>
      {cards.length > 0 ? (
        <>
          {renderProgress?.(set.data)}
          <StudyModeGrid setId={id} />
          <CardList
            cards={cards}
            termLang={termLang}
            defLang={defLang}
            renderCardExtra={renderCardExtra}
          />
        </>
      ) : (
        <EmptyState
          title="Bộ từ này chưa có thẻ"
          description="Thẻ được thêm sẽ hiện ở đây."
          action={renderEmptyAction?.(set.data)}
        />
      )}
    </>
  );
}
