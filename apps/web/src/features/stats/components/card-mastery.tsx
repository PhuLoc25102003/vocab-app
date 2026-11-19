'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { CardProgressItem } from '@vocab/shared';
import { cn } from '@/lib/utils';
import { getCardProgress } from '../api';

const LEVEL_LABELS: Record<CardProgressItem['level'], string> = {
  new: 'Mới',
  learning: 'Đang học',
  mastered: 'Đã thuộc',
};

const dateFormat = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' });

export function cardProgressQuery(setId: string) {
  return {
    queryKey: ['stats', 'set', setId, 'cards'] as const,
    queryFn: () => getCardProgress(setId),
  };
}

/** Mức nhớ và ngày ôn tiếp theo của một thẻ. Mọi thẻ dùng chung một lần tải. */
export function CardMasteryBadge({ setId, cardId }: { setId: string; cardId: string }) {
  const progress = useQuery({ ...cardProgressQuery(setId), staleTime: 30_000 });
  // Mốc so sánh lấy một lần khi hiện, đủ chính xác cho nhãn đến hạn.
  const [now] = useState(() => Date.now());
  const item = progress.data?.find((card) => card.cardId === cardId);
  if (!item) {
    return null;
  }
  const due = item.dueAt && item.dueAt.getTime() <= now;

  return (
    <p className="mt-1 flex flex-wrap items-center gap-2 text-small">
      <span
        className={cn(
          'rounded-sm border px-2',
          item.level === 'mastered' && 'border-success text-success',
          item.level === 'learning' && 'border-primary text-primary',
          item.level === 'new' && 'border-border-strong text-text-muted',
        )}
      >
        {LEVEL_LABELS[item.level]}
      </span>
      {item.dueAt ? (
        <span className="text-text-muted">
          {due ? 'Đã đến hạn ôn' : `Ôn lại ${dateFormat.format(item.dueAt)}`}
        </span>
      ) : null}
    </p>
  );
}
