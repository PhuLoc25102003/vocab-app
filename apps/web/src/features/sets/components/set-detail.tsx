'use client';

import type { SetDetail as SetDetailData } from '@vocab/shared';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { useSet } from '../hooks/use-set';
import { CardList } from './card-list';
import { SetDetailSkeleton } from './set-detail-skeleton';
import { SetLoadFailure } from './set-load-failure';
import { SetMeta } from './set-meta';
import { StudyModeGrid } from './study-mode-grid';
import { useTranslation } from 'react-i18next';

interface SetDetailProps {
  id: string;
  fromExplore?: boolean;
  /** Nút theo quyền của người xem, do tầng trang ghép vào. */
  renderActions: (set: SetDetailData) => ReactNode;
  /** Chủ bộ từ và người xem từ Khám phá quay về hai nơi khác nhau. */
  renderBack?: (set: SetDetailData) => ReactNode;
  /** Thông tin thêm trên dòng thông tin, ví dụ thư mục của chủ bộ. */
  renderMeta?: (set: SetDetailData) => ReactNode;
  /** Tiến độ của người xem, hiện khi bộ từ có thẻ. */
  renderProgress?: (set: SetDetailData) => ReactNode;
  /** Thông tin thêm cho từng thẻ, ví dụ mức nhớ. */
  renderCardExtra?: (cardId: string) => ReactNode;
  /** Hành động khi bộ từ chưa có thẻ, theo quyền của người xem. */
  renderEmptyAction?: (set: SetDetailData) => ReactNode;
}

export function SetDetail({
  id,
  fromExplore,
  renderActions,
  renderBack,
  renderMeta,
  renderProgress,
  renderCardExtra,
  renderEmptyAction,
}: SetDetailProps) {
  const { t } = useTranslation('sets');
  const set = useSet(id);

  if (set.isPending) {
    return <SetDetailSkeleton />;
  }
  if (set.isError) {
    return <SetLoadFailure error={set.error} onRetry={() => void set.refetch()} />;
  }

  const { title, description, cards, termLang, defLang, hiddenAt, hiddenReason } = set.data;

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
          {t('detail.hidden', { reason: hiddenReason })}
        </p>
      ) : null}
      <SetMeta set={set.data}>{renderMeta?.(set.data)}</SetMeta>
      {cards.length > 0 ? (
        <>
          {renderProgress?.(set.data)}
          <StudyModeGrid setId={id} fromExplore={fromExplore} />
          <CardList
            cards={cards}
            termLang={termLang}
            defLang={defLang}
            renderCardExtra={renderCardExtra}
          />
        </>
      ) : (
        <EmptyState
          title={t('noCards')}
          description={t('detail.noCardsHint')}
          action={renderEmptyAction?.(set.data)}
        />
      )}
    </>
  );
}
