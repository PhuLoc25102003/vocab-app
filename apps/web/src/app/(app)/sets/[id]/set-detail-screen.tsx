'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { BackLink } from '@/components/common/back-link';
import { Button } from '@/components/ui/button';
import { HideSetButton } from '@/features/admin/components/hide-set-button';
import { Can } from '@/features/auth/components/can';
import { SetFolderPicker } from '@/features/folders/components/set-folder-picker';
import { OfflineToggle } from '@/features/sets/components/offline-toggle';
import { DuplicateSetButton, SetOwnerActions } from '@/features/sets/components/set-actions';
import { SetDetail } from '@/features/sets/components/set-detail';
import { CardMasteryBadge } from '@/features/stats/components/card-mastery';
import { SetProgressSummary } from '@/features/stats/components/set-progress';
import { useTranslation } from 'react-i18next';

/** Feature không import lẫn nhau, nên quyền và nút bộ từ được ghép ở tầng trang. */
export function SetDetailScreen({ id }: { id: string }) {
  const { t } = useTranslation();
  return (
    <SetDetail
      id={id}
      renderBack={(set) => (
        <Can
          action="update"
          resource={set}
          fallback={<BackLink href="/explore" label={t('pages.backToExplore')} />}
        >
          <BackLink href="/sets" label={t('pages.backToSets')} />
        </Can>
      )}
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
        const adminAction = (
          <Can action="moderate-content">
            <HideSetButton setId={set.id} hidden={Boolean(set.hiddenAt)} />
          </Can>
        );

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
            <SetOwnerActions set={set} extraActions={adminAction} />
          </Can>
        );
      }}
    />
  );
}
