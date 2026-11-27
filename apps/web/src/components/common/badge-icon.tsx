import type { BadgeCode } from '@vocab/shared';
import { Award, Flame, Library, type LucideIcon, Moon, Target, Trophy } from 'lucide-react';

/** Icon của từng huy hiệu, dùng ở trang Tài khoản và màn kết quả. */
export const BADGE_ICONS: Record<BadgeCode, LucideIcon> = {
  'mastered-100': Award,
  'streak-7': Flame,
  'streak-30': Flame,
  'perfect-test': Trophy,
  'sets-10': Library,
  'goal-7': Target,
  'night-owl': Moon,
};

export function isBadgeCode(code: string): code is BadgeCode {
  return code in BADGE_ICONS;
}
