'use client';

import { useQuery } from '@tanstack/react-query';
import { XP_RULES } from '@vocab/shared';
import { Sparkles } from 'lucide-react';
import { BADGE_ICONS, isBadgeCode } from '@/components/common/badge-icon';
import { useTranslation } from 'react-i18next';
import { getXpSummary, SESSION_XP_KEY } from '../api';

/**
 * XP của phiên vừa xong trên màn kết quả. Lên cấp khi XP của phiên lớn hơn XP đã có trong cấp hiện
 * tại, vì XP trong cấp về 0 mỗi lần lên cấp.
 */
export function SessionXp({
  xpEarned,
  newBadges = [],
}: {
  xpEarned: number;
  /** Mã huy hiệu vừa nhận sau phiên. */
  newBadges?: readonly string[];
}) {
  const { t } = useTranslation('study');
  // Khách và phiên offline có `xpEarned = 0`, không cần gọi API.
  const xp = useQuery({
    queryKey: SESSION_XP_KEY,
    queryFn: getXpSummary,
    staleTime: 0,
    enabled: xpEarned > 0,
  });

  const badges = newBadges.filter(isBadgeCode);
  if (xpEarned <= 0 && badges.length === 0) {
    return null;
  }
  const summary = xp.data;
  const leveledUp = summary !== undefined && summary.level > 1 && xpEarned > summary.xpIntoLevel;

  return (
    <div role="status" className="flex flex-wrap items-center gap-2">
      {xpEarned > 0 ? (
        <span className="feedback-correct rounded-full bg-highlight px-3 py-1 font-semibold text-highlight-fg tabular-nums">
          {t('xp.earned', { xp: xpEarned })}
        </span>
      ) : null}
      {summary ? (
        leveledUp ? (
          <span className="feedback-correct inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 font-semibold text-success">
            <Sparkles aria-hidden className="size-4" />
            {t('xp.levelUp', { level: summary.level })}
          </span>
        ) : (
          <span className="text-small text-text-muted tabular-nums">
            {t('xp.level', { level: summary.level })} ·{' '}
            {t('xp.toNextLevel', {
              xp: summary.xpForNextLevel - summary.xpIntoLevel,
              level: summary.level + 1,
            })}
          </span>
        )
      ) : null}
      {badges.map((code) => {
        const Icon = BADGE_ICONS[code];
        return (
          <span
            key={code}
            className="feedback-correct inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3 py-1 font-medium"
          >
            <Icon aria-hidden className="size-4 text-primary" />
            {t('badges.new')}: {t(`badges.items.${code}.name`)}
          </span>
        );
      })}
      {summary && summary.todayXp >= XP_RULES.dailyCap ? (
        <p className="w-full text-small text-text-muted">{t('xp.capReached')}</p>
      ) : null}
    </div>
  );
}
