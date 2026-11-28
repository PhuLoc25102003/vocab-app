import type { BadgeCode } from '@vocab/shared';
import {
  Award,
  CalendarCheck,
  Crown,
  Flame,
  Gem,
  Library,
  type LucideIcon,
  Medal,
  Moon,
  Rocket,
  Target,
  Trophy,
} from 'lucide-react';

/** Icon của từng huy hiệu, dùng ở trang Tài khoản và màn kết quả. */
export const BADGE_ICONS: Record<BadgeCode, LucideIcon> = {
  'mastered-100': Award,
  'mastered-500': Gem,
  'streak-7': Flame,
  'streak-30': Flame,
  'streak-100': Crown,
  'perfect-test': Trophy,
  'perfect-test-10': Medal,
  'sets-10': Library,
  'goal-7': Target,
  'goal-30': CalendarCheck,
  'word-rain-5000': Rocket,
  'night-owl': Moon,
};

export function isBadgeCode(code: string): code is BadgeCode {
  return code in BADGE_ICONS;
}
