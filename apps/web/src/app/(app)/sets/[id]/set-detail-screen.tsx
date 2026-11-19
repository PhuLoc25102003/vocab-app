'use client';

import { BackLink } from '@/components/common/back-link';
import { Can } from '@/features/auth/components/can';
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
      renderProgress={(set) => <SetProgressSummary setId={set.id} />}
      renderActions={(set) => (
        <Can action="update" resource={set} fallback={<DuplicateSetButton id={set.id} />}>
          <SetOwnerActions id={set.id} />
        </Can>
      )}
    />
  );
}
