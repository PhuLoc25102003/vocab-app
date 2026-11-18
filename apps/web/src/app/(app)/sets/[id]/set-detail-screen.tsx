'use client';

import { Can } from '@/features/auth/components/can';
import { DuplicateSetButton, SetOwnerActions } from '@/features/sets/components/set-actions';
import { SetDetail } from '@/features/sets/components/set-detail';

/** Feature không import lẫn nhau, nên quyền và nút bộ từ được ghép ở tầng trang. */
export function SetDetailScreen({ id }: { id: string }) {
  return (
    <SetDetail
      id={id}
      renderActions={(set) => (
        <Can action="update" resource={set} fallback={<DuplicateSetButton id={set.id} />}>
          <SetOwnerActions id={set.id} />
        </Can>
      )}
    />
  );
}
