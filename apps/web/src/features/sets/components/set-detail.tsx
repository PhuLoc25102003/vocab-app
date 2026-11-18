'use client';

import type { SetDetail as SetDetailData } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { useSet } from '../hooks/use-set';
import { CardList } from './card-list';
import { SetDetailSkeleton } from './set-detail-skeleton';
import { SetLoadFailure } from './set-load-failure';
import { SetMeta } from './set-meta';

interface SetDetailProps {
  id: string;
  /** Nút theo quyền của người xem, do tầng trang ghép vào. */
  renderActions: (set: SetDetailData) => ReactNode;
}

export function SetDetail({ id, renderActions }: SetDetailProps) {
  const set = useSet(id);

  if (set.isPending) {
    return <SetDetailSkeleton />;
  }
  if (set.isError) {
    return <SetLoadFailure error={set.error} onRetry={() => void set.refetch()} />;
  }

  const { title, description, visibility, cards, termLang, defLang } = set.data;

  return (
    <>
      <PageHeader
        title={title}
        description={description ?? undefined}
        actions={renderActions(set.data)}
      />
      <SetMeta set={set.data}>
        {visibility === 'PUBLIC' ? (
          <Link
            href={`/public/sets/${id}` as Route}
            className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4"
          >
            Xem trang công khai
          </Link>
        ) : null}
      </SetMeta>
      {cards.length > 0 ? (
        <CardList cards={cards} termLang={termLang} defLang={defLang} />
      ) : (
        <EmptyState title="Bộ từ này chưa có thẻ" description="Thẻ được thêm sẽ hiện ở đây." />
      )}
    </>
  );
}
