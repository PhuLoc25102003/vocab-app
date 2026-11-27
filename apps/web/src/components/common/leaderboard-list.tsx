'use client';

import type { Leaderboard, LeaderboardEntry } from '@vocab/shared';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words.at(-1)] : [words[0]];
  return letters
    .map((word) => (word ? Array.from(word)[0] : ''))
    .join('')
    .toLocaleUpperCase();
}

function rankStyle(rank: number) {
  if (rank === 1) return 'bg-highlight text-highlight-fg';
  if (rank <= 3) return 'bg-primary-soft text-primary';
  return 'text-text-muted';
}

function Row({ entry }: { entry: LeaderboardEntry }) {
  const { t, i18n } = useTranslation('common');
  const { rank, displayName, xp, isMe } = entry;
  return (
    <li
      aria-current={isMe ? 'true' : undefined}
      className={cn(
        'flex min-h-14 items-center gap-3 px-2 py-2',
        isMe && 'rounded-md bg-primary-soft/60',
      )}
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full text-small font-semibold tabular-nums',
          rankStyle(rank),
        )}
      >
        <span className="sr-only">{t('leaderboard.rank')} </span>
        {rank}
      </span>
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-small font-semibold text-primary"
      >
        {initials(displayName)}
      </span>
      <span className="min-w-0 flex-1 break-words font-medium">
        {displayName}
        {isMe ? (
          <span className="ml-2 text-small font-normal text-text-muted">
            {t('leaderboard.you')}
          </span>
        ) : null}
      </span>
      <span className="shrink-0 text-small font-semibold tabular-nums">
        {t('leaderboard.xp', { xp: new Intl.NumberFormat(i18n.language).format(xp) })}
      </span>
    </li>
  );
}

/**
 * Danh sách xếp hạng dạng dòng, dùng ở trang Xếp hạng, Tổng quan và trang lớp của giáo viên.
 * `limit` cắt bớt top (Tổng quan chỉ hiện 3); hạng của tôi ngoài phần hiện ra thì thêm ở cuối.
 */
export function LeaderboardList({
  board,
  limit,
  label,
}: {
  board: Pick<Leaderboard, 'entries' | 'me'>;
  limit?: number;
  label: string;
}) {
  const shown = limit === undefined ? board.entries : board.entries.slice(0, limit);
  const me = board.me;
  const meShown = me !== null && shown.some(({ isMe }) => isMe);
  return (
    <ol aria-label={label} className="flex flex-col divide-y divide-border-strong/40">
      {shown.map((entry) => (
        <Row key={entry.rank} entry={entry} />
      ))}
      {me && !meShown ? (
        <>
          <li aria-hidden className="py-1 text-center text-text-muted">
            ⋯
          </li>
          <Row entry={me} />
        </>
      ) : null}
    </ol>
  );
}
