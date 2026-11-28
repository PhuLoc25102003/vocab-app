'use client';

import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { getXpSummary, XP_SUMMARY_KEY } from '../api';

/**
 * Cấp độ trong thẻ hồ sơ ở trang Tài khoản. Dùng chung truy vấn XP với Tổng quan và phần mục tiêu
 * ngày nên không gọi thêm API. Lỗi thì ẩn đi vì phần mục tiêu ngày bên cạnh đã có nút thử lại.
 */
export function AccountLevel() {
  const { t, i18n } = useTranslation('study');
  const xp = useQuery({ queryKey: XP_SUMMARY_KEY, queryFn: getXpSummary });

  if (xp.isPending) {
    return <Skeleton aria-label={t('xp.loading')} className="h-16 w-full rounded-lg" />;
  }
  if (xp.isError) return null;

  const { level, totalXp, xpIntoLevel, xpForNextLevel } = xp.data;
  const format = new Intl.NumberFormat(i18n.language);
  const percent = Math.round((xpIntoLevel / xpForNextLevel) * 100);

  return (
    <section
      aria-labelledby="account-level-title"
      className="flex w-full flex-col gap-2 border-t border-border pt-4 text-left"
    >
      <h2 id="account-level-title" className="sr-only">
        {t('xp.account.title')}
      </h2>
      <div className="flex items-baseline justify-between gap-2">
        <p className="flex items-center gap-1.5 font-semibold text-text">
          <Sparkles aria-hidden className="size-4 text-primary" />
          {t('xp.account.level', { level })}
        </p>
        <p className="text-small text-text-muted tabular-nums">
          {t('xp.account.total', { xp: format.format(totalXp) })}
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={t('xp.levelBar', { level: level + 1 })}
        aria-valuemin={0}
        aria-valuemax={xpForNextLevel}
        aria-valuenow={xpIntoLevel}
        className="h-2 w-full overflow-hidden rounded-full bg-primary-soft"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-small text-text-muted">
        {t('xp.account.next', {
          xp: format.format(xpForNextLevel - xpIntoLevel),
          level: level + 1,
        })}
      </p>
    </section>
  );
}
