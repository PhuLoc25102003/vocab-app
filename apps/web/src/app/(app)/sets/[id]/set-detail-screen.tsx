'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { BackLink } from '@/components/common/back-link';
import { Button } from '@/components/ui/button';
import { Can } from '@/features/auth/components/can';
import { SetFolderPicker } from '@/features/folders/components/set-folder-picker';
import { DuplicateSetButton, SetOwnerActions } from '@/features/sets/components/set-actions';
import { SetDetail } from '@/features/sets/components/set-detail';
import { SetProgressSummary } from '@/features/stats/components/set-progress';

/** Feature không import lẫn nhau, nên quyền và nút bộ từ được ghép ở tầng trang. */
export function SetDetailScreen({ id }: { id: string }) {
  return (
    <SetDetail
      id={id}
      renderBack={(set) => (
        <Can
          action="update"
          resource={set}
          fallback={<BackLink href="/explore" label="Quay lại Khám phá" />}
        >
          <BackLink href="/sets" label="Quay lại Bộ từ" />
        </Can>
      )}
      renderEmptyAction={(set) => (
        <Can action="update" resource={set} fallback={null}>
          <Button asChild>
            <Link href={`/sets/${set.id}/edit` as Route}>Thêm thẻ</Link>
          </Button>
        </Can>
      )}
      renderProgress={(set) => <SetProgressSummary setId={set.id} />}
      renderActions={(set) => (
        <Can action="update" resource={set} fallback={<DuplicateSetButton id={set.id} />}>
          <SetOwnerActions id={set.id} />
          {/* API chỉ trả `folderId` cho chủ bộ từ. */}
          {set.folderId !== undefined ? (
            <SetFolderPicker setId={set.id} folderId={set.folderId} />
          ) : null}
        </Can>
      )}
    />
  );
}
