'use client';

import type { SetDetail } from '@vocab/shared';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface SetMetaProps {
  set: SetDetail;
  children?: ReactNode;
}

export function SetMeta({ set: { visibility, cardCount, owner }, children }: SetMetaProps) {
  const { t } = useTranslation(['sets', 'common']);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-text-muted">
      <span className="rounded-sm bg-primary-soft px-2 text-tiny text-primary">
        {t(`common:visibility.${visibility}`)}
      </span>
      <span className="tabular-nums">{t('cardCount', { count: cardCount })}</span>
      <span className="min-w-0 wrap-anywhere">{t('createdBy', { name: owner.displayName })}</span>
      {children}
    </div>
  );
}
