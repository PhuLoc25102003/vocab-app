'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { CardProgressItem } from '@vocab/shared';
import { cn } from '@/lib/utils';
import { getCardProgress } from '../api';
import { useTranslation } from 'react-i18next';

const LEVEL_LABELS = {
  new: 'stats.new',
  learning: 'stats.learning',
  mastered: 'stats.mastered',
} as const satisfies Record<CardProgressItem['level'], string>;

const formatDueDay = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);

export function cardProgressQuery(setId: string) {
  return {
    queryKey: ['stats', 'set', setId, 'cards'] as const,
    queryFn: () => getCardProgress(setId),
  };
}

/** Mức nhớ và ngày ôn tiếp theo của một thẻ. Mọi thẻ dùng chung một lần tải. */
export function CardMasteryBadge({ setId, cardId }: { setId: string; cardId: string }) {
  const { t, i18n } = useTranslation('study');
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
        {t(LEVEL_LABELS[item.level])}
      </span>
      {item.dueAt ? (
        <span className="text-text-muted">
          {due
            ? t('stats.dueNow')
            : t('stats.reviewOn', { date: formatDueDay(item.dueAt, i18n.language) })}
        </span>
      ) : null}
    </p>
  );
}
