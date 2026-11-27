'use client';

import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { LeaderboardBoard } from './leaderboard-board';

/** Khối "Xếp hạng tuần" trên Tổng quan: top 3 và hạng của tôi, link tới trang đầy đủ. */
export function LeaderboardPreview() {
  const { t } = useTranslation('common');
  return (
    <section
      aria-labelledby="leaderboard-preview-heading"
      className="glass-surface flex flex-col gap-3 rounded-xl border border-border p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3">
        <h2 id="leaderboard-preview-heading" className="flex items-center gap-2 text-h3">
          <Trophy aria-hidden className="size-5 text-primary" />
          {t('leaderboard.title')}
        </h2>
        <Link
          href="/leaderboard"
          className="inline-flex min-h-11 items-center text-small font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('leaderboard.viewAll')}
        </Link>
      </div>
      <LeaderboardBoard scope="global" week="current" limit={3} />
    </section>
  );
}
