'use client';

import type { SetDetail as SetDetailData } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { CopyLinkButton } from '@/components/common/copy-link-button';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { useSet } from '../hooks/use-set';
import { STUDY_ENTRIES } from '../labels';
import { CardList } from './card-list';
import { SetDetailSkeleton } from './set-detail-skeleton';
import { SetLoadFailure } from './set-load-failure';
import { SetMeta } from './set-meta';

interface SetDetailProps {
  id: string;
  /** Nút theo quyền của người xem, do tầng trang ghép vào. */
  renderActions: (set: SetDetailData) => ReactNode;
  /** Chủ bộ từ và người xem từ Khám phá quay về hai nơi khác nhau. */
  renderBack?: (set: SetDetailData) => ReactNode;
  /** Tiến độ của người xem, hiện khi bộ từ có thẻ. */
  renderProgress?: (set: SetDetailData) => ReactNode;
  /** Hành động khi bộ từ chưa có thẻ, theo quyền của người xem. */
  renderEmptyAction?: (set: SetDetailData) => ReactNode;
}

export function SetDetail({
  id,
  renderActions,
  renderBack,
  renderProgress,
  renderEmptyAction,
}: SetDetailProps) {
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
      {renderBack?.(set.data)}
      <PageHeader
        title={title}
        description={description ?? undefined}
        actions={renderActions(set.data)}
      />
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
          <div className="flex flex-wrap gap-2">
            {STUDY_ENTRIES.map(({ slug, label }, index) => (
              <Button key={slug} asChild variant={index === 0 ? 'primary' : 'secondary'}>
                <Link href={`/sets/${id}/study/${slug}` as Route}>{label}</Link>
              </Button>
            ))}
          </div>
          <CardList cards={cards} termLang={termLang} defLang={defLang} />
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
