'use client';

import { useQuery } from '@tanstack/react-query';
import type { Route } from 'next';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';
import { GlassTabGroup, GlassTabIndicator } from '@/components/ui/glass-tabs';
import { getLeaderboardClasses, leaderboardKeys, type LeaderboardWeek } from '../api';
import { LeaderboardBoard } from './leaderboard-board';

function TabLink({ href, current, children }: { href: Route; current: boolean; children: string }) {
  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      className="glass-button-ghost relative isolate inline-flex min-h-11 max-w-[16rem] shrink-0 items-center rounded-full px-4 font-medium text-text-muted hover:text-text aria-[current=page]:text-primary"
    >
      {current ? <GlassTabIndicator /> : null}
      <span className="truncate">{children}</span>
    </Link>
  );
}

const tabBar =
  'glass-surface flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border p-1 no-scrollbar';

/** Trang Xếp hạng: tab Toàn app và từng lớp đã tham gia, chọn tuần này hoặc tuần trước. */
export function LeaderboardScreen() {
  const { t } = useTranslation('common');
  const searchParams = useSearchParams();
  const classes = useQuery({ queryKey: leaderboardKeys.classes, queryFn: getLeaderboardClasses });
  const requested = searchParams.get('scope') ?? 'global';
  // Lớp không còn trong danh sách (đã rời lớp) thì quay về bảng chung.
  const scope =
    requested === 'global' || !classes.data || classes.data.some(({ id }) => id === requested)
      ? requested
      : 'global';
  const week: LeaderboardWeek = searchParams.get('week') === 'previous' ? 'previous' : 'current';
  // Tab và tuần nằm trong URL để nút quay lại của trình duyệt về đúng bảng.
  const href = (next: { scope?: string; week?: LeaderboardWeek }) => {
    const params = new URLSearchParams();
    const nextScope = next.scope ?? scope;
    const nextWeek = next.week ?? week;
    if (nextScope !== 'global') params.set('scope', nextScope);
    if (nextWeek === 'previous') params.set('week', 'previous');
    const query = params.toString();
    return `/leaderboard${query ? `?${query}` : ''}` as Route;
  };

  return (
    <>
      <BackLink href="/dashboard" label={t('leaderboard.backToDashboard')} />
      <PageHeader title={t('leaderboard.title')} description={t('leaderboard.description')} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label={t('leaderboard.scopes')} className={tabBar}>
          <GlassTabGroup>
            <TabLink href={href({ scope: 'global' })} current={scope === 'global'}>
              {t('leaderboard.global')}
            </TabLink>
            {classes.data?.map(({ id, name }) => (
              <TabLink key={id} href={href({ scope: id })} current={scope === id}>
                {name}
              </TabLink>
            ))}
          </GlassTabGroup>
        </nav>
        <nav aria-label={t('leaderboard.weeks')} className={tabBar}>
          <GlassTabGroup>
            <TabLink href={href({ week: 'current' })} current={week === 'current'}>
              {t('leaderboard.thisWeek')}
            </TabLink>
            <TabLink href={href({ week: 'previous' })} current={week === 'previous'}>
              {t('leaderboard.lastWeek')}
            </TabLink>
          </GlassTabGroup>
        </nav>
      </div>
      <section className="glass-surface rounded-xl border border-border p-2 sm:p-4">
        <LeaderboardBoard scope={scope} week={week} />
      </section>
    </>
  );
}
