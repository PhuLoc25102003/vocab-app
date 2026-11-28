'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BADGE_ICONS } from '@/components/common/badge-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { BADGES_KEY, getBadges } from '../api';

/**
 * Huy hiệu đã có trong thẻ hồ sơ ở trang Tài khoản: hàng biểu tượng sáng màu, rê hoặc focus để
 * xem tên, kèm lối xuống danh sách đầy đủ. Dùng chung truy vấn với `BadgeList` nên không gọi thêm.
 */
export function ProfileBadges() {
  const { t } = useTranslation('study');
  const badges = useQuery({ queryKey: BADGES_KEY, queryFn: getBadges });

  if (badges.isPending) {
    return <Skeleton aria-label={t('badges.loading')} className="h-14 w-full rounded-lg" />;
  }
  // Lỗi thì ẩn: danh sách huy hiệu ở cột chính đã có nút thử lại.
  if (badges.isError) return null;

  const earned = badges.data.filter(({ earnedAt }) => earnedAt !== null);

  return (
    <section
      aria-labelledby="profile-badges-title"
      className="flex w-full flex-col gap-2 border-t border-border pt-4 text-left"
    >
      <h2 id="profile-badges-title" className="text-small font-medium text-text-muted">
        {t('badges.profileTitle')}
      </h2>
      {earned.length === 0 ? (
        <p className="text-small text-text-muted">{t('badges.profileNone')}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {earned.map(({ code }) => {
            const Icon = BADGE_ICONS[code];
            const name = t(`badges.items.${code}.name`);
            return (
              <li key={code}>
                <span
                  title={name}
                  className="flex size-9 items-center justify-center rounded-full bg-highlight text-highlight-fg"
                >
                  <Icon aria-hidden className="size-4" />
                  <span className="sr-only">{name}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <a
        href="#badges-title"
        className="inline-flex min-h-11 items-center text-small font-medium text-primary underline-offset-4 hover:underline"
      >
        {t('badges.viewAll')}
      </a>
    </section>
  );
}
