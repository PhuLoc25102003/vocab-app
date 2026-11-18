import type { SetDetail } from '@vocab/shared';
import type { ReactNode } from 'react';
import { VISIBILITY_LABELS } from '../labels';

interface SetMetaProps {
  set: SetDetail;
  children?: ReactNode;
}

export function SetMeta({ set: { visibility, cardCount, owner }, children }: SetMetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-text-muted">
      <span className="rounded-sm bg-primary-soft px-2 text-tiny text-primary">
        {VISIBILITY_LABELS[visibility]}
      </span>
      <span className="tabular-nums">{cardCount} thẻ</span>
      <span>Tạo bởi {owner.displayName}</span>
      {children}
    </div>
  );
}
