'use client';

import { XP_RULES, xpForLevel } from '@vocab/shared';
import { ChevronDown, CircleHelp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const EXAMPLE = {
  answers: XP_RULES.comboSize,
  due: 2,
};

/**
 * Giải thích cách cộng XP, lên cấp và mục tiêu ngày. Mọi con số lấy từ `XP_RULES` và
 * `xpForLevel` ở `@vocab/shared`, cùng nguồn với server nên không lệch khi đổi luật.
 */
export function XpGuide({ className }: { className?: string }) {
  const { t, i18n } = useTranslation('study');
  const exampleTotal =
    EXAMPLE.answers * XP_RULES.correct + EXAMPLE.due * XP_RULES.dueBonus + XP_RULES.comboBonus;
  const rules = [
    t('xp.guide.correct', { xp: XP_RULES.correct }),
    t('xp.guide.due', { xp: XP_RULES.dueBonus }),
    t('xp.guide.combo', { size: XP_RULES.comboSize, xp: XP_RULES.comboBonus }),
    t('xp.guide.repeat', { minutes: XP_RULES.repeatWindowMs / 60_000 }),
    t('xp.guide.selfGraded', {
      xp: XP_RULES.selfGraded,
      seconds: new Intl.NumberFormat(i18n.language).format(XP_RULES.selfGradedMinMs / 1000),
    }),
    t('xp.guide.cap', { xp: XP_RULES.dailyCap }),
  ];

  return (
    <details className={cn('group rounded-lg border border-border bg-surface', className)}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-4 py-2 font-medium text-text marker:hidden hover:bg-primary-soft [&::-webkit-details-marker]:hidden">
        <CircleHelp aria-hidden className="size-5 shrink-0 text-primary" />
        <span className="flex-1">{t('xp.guide.title')}</span>
        <ChevronDown
          aria-hidden
          className="size-5 shrink-0 text-text-muted transition-transform duration-fast ease-standard group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div className="flex flex-col gap-4 px-4 pt-1 pb-4 text-small text-text-muted">
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          {rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <p className="rounded-md bg-primary-soft px-3 py-2 text-text">
          {t('xp.guide.example', {
            correct: XP_RULES.correct,
            due: XP_RULES.dueBonus,
            combo: XP_RULES.comboBonus,
            total: exampleTotal,
          })}
        </p>
        <div className="flex flex-col gap-1">
          <h3 className="font-medium text-text">{t('xp.guide.levelTitle')}</h3>
          <p>
            {t('xp.guide.level', {
              first: xpForLevel(1),
              step: xpForLevel(2) - xpForLevel(1),
              second: xpForLevel(2),
              third: xpForLevel(3),
            })}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-medium text-text">{t('xp.guide.goalTitle')}</h3>
          <p>{t('xp.guide.goal')}</p>
        </div>
      </div>
    </details>
  );
}
