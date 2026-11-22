'use client';

import type { SetDetail as SetDetailData } from '@vocab/shared';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/common/empty-state';
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
      <div className="flex flex-col gap-3 rounded-lg border border-border-strong/70 bg-surface/80 px-4 py-2.5 sm:px-5 sm:py-3.5 shadow-sm shadow-primary/5 backdrop-blur-md">
        <div className="flex min-h-[44px] flex-wrap items-center justify-between gap-3">
          <div className="flex max-w-[65ch] min-w-0 flex-col gap-0.5">
            <h1 className="text-[1.65rem] font-bold text-text wrap-anywhere tracking-tight leading-tight sm:text-[1.85rem]">
              {title}
            </h1>
            {description ? (
              <p className="wrap-anywhere text-small text-text-muted">{description}</p>
            ) : null}
          </div>
          {renderActions ? <div className="w-full sm:w-auto">{renderActions(set.data)}</div> : null}
        </div>
        {hiddenAt ? (
          <p role="status" className="border-l-4 border-danger-mark pl-3 text-danger text-small">
            {t('detail.hidden', { reason: hiddenReason })}
          </p>
        ) : null}
        <div className="border-t border-border pt-3">
          <SetMeta set={set.data}>{renderMeta?.(set.data)}</SetMeta>
        </div>
      </div>
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
