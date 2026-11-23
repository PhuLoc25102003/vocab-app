'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BackLink } from '@/components/common/back-link';
import { Button } from '@/components/ui/button';
import { HideSetButton } from '@/features/admin/components/hide-set-button';
import { Can } from '@/features/auth/components/can';
import { useAuthStore } from '@/features/auth/store';
import { SetFolderPicker } from '@/features/folders/components/set-folder-picker';
import { OfflineToggle } from '@/features/sets/components/offline-toggle';
import { DuplicateSetButton, SetOwnerActions } from '@/features/sets/components/set-actions';
import { SetDetail } from '@/features/sets/components/set-detail';
import { ToggleVisibilityButton } from '@/features/sets/components/toggle-visibility-button';
import { CardMasteryBadge } from '@/features/stats/components/card-mastery';
import { SetProgressSummary } from '@/features/stats/components/set-progress';
import { useTranslation } from 'react-i18next';

/** Feature không import lẫn nhau, nên quyền và nút bộ từ được ghép ở tầng trang. */
export function SetDetailScreen({ id }: { id: string }) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const fromExplore = searchParams.get('from') === 'explore';
  const fromReview = searchParams.get('from') === 'review';
  const user = useAuthStore((state) => state.user);

  return (
    <SetDetail
      id={id}
      fromExplore={fromExplore}
      renderBack={(set) => {
        if (fromReview) {
          return <BackLink href="/review" label={t('pages.backToReview')} />;
        }
        if (fromExplore) {
          return <BackLink href="/explore" label={t('pages.backToExplore')} />;
        }
        return (
          <Can
            action="update"
            resource={set}
            fallback={<BackLink href="/explore" label={t('pages.backToExplore')} />}
          >
            <BackLink href="/sets" label={t('pages.backToSets')} />
          </Can>
        );
      }}
      renderEmptyAction={(set) => (
        <Can action="update" resource={set} fallback={null}>
          <Button asChild>
            <Link href={`/sets/${set.id}/edit` as Route}>{t('pages.addCards')}</Link>
          </Button>
        </Can>
      )}
      renderMeta={(set) =>
        // API chỉ trả `folderId` cho chủ bộ từ.
        set.folderId !== undefined ? (
          <Can action="update" resource={set} fallback={null}>
            <SetFolderPicker setId={set.id} folderId={set.folderId} />
          </Can>
        ) : null
      }
      renderProgress={(set) => <SetProgressSummary setId={set.id} />}
      renderCardExtra={(cardId) => <CardMasteryBadge setId={id} cardId={cardId} />}
      renderActions={(set) => {
        const isOwner = user?.id === set.ownerId;
        const isOtherAdmin = user?.role === 'ADMIN' && !isOwner;

        // Chỉ Admin kiểm duyệt bộ từ của người khác mới có nút Ẩn bộ từ
        const adminAction = isOtherAdmin ? (
          <Can action="moderate-content">
            <HideSetButton setId={set.id} hidden={Boolean(set.hiddenAt)} />
          </Can>
        ) : null;

        // Bộ từ của chính mình thì có nút chuyển đổi Public <-> Private
        const ownerExtraAction = isOwner ? <ToggleVisibilityButton set={set} /> : adminAction;

        return (
          <Can
            action="update"
            resource={set}
            fallback={
              <>
                <DuplicateSetButton id={set.id} />
                <OfflineToggle set={set} />
                {adminAction}
              </>
            }
          >
            <SetOwnerActions set={set} extraActions={ownerExtraAction} />
          </Can>
        );
      }}
    />
  );
}
