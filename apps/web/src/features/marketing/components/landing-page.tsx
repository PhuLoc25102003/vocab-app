'use client';

import {
  Award,
  BellRing,
  CalendarClock,
  ClipboardCheck,
  CloudRain,
  Flame,
  GraduationCap,
  Headphones,
  Keyboard,
  Layers,
  ListChecks,
  Mic,
  PenLine,
  Shuffle,
  Sparkles,
  Star,
  TextCursorInput,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { BRAND_NAME } from '@/components/common/logo';
import { SessionLink } from '@/components/common/session-link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FighterJet } from './fighter-jet';
import { MarketingShell } from './marketing-shell';

const MODES = [
  { key: 'flashcard', icon: Layers },
  { key: 'mcq', icon: ListChecks },
  { key: 'match', icon: Shuffle },
  { key: 'learn', icon: GraduationCap },
  { key: 'write', icon: PenLine },
  { key: 'dictation', icon: Headphones },
  { key: 'cloze', icon: TextCursorInput },
  { key: 'speak', icon: Mic },
  { key: 'test', icon: ClipboardCheck },
  { key: 'word_rain', icon: CloudRain },
] as const satisfies readonly { key: string; icon: LucideIcon }[];

const GAME_POINTS = [
  { key: 'type', icon: Keyboard },
  { key: 'speak', icon: Mic },
  { key: 'combo', icon: Flame },
] as const satisfies readonly { key: string; icon: LucideIcon }[];

/** Nghĩa rơi trong khung trời: thời gian và độ trễ khác nhau để mưa không đều; `rest` là chỗ đứng khi giảm chuyển động. */
const DROPS = [
  { key: 'first', left: '6%', time: '11s', delay: '-2s', rest: '1.5rem' },
  { key: 'second', left: '60%', time: '13s', delay: '-8s', rest: '3rem' },
  { key: 'third', left: '24%', time: '10s', delay: '-5s', rest: '6.5rem' },
  { key: 'fourth', left: '66%', time: '12s', delay: '-11s', rest: '9rem' },
  { key: 'fifth', left: '10%', time: '14s', delay: '-12.5s', rest: '12rem' },
] as const;

const SCHEDULE = ['today', 'day1', 'day6', 'later'] as const;
const HIGHLIGHTS = ['modes', 'schedule', 'game', 'free'] as const;
const LEADERS = [
  { name: 'Minh Anh', xp: '1 240' },
  { name: null, xp: '980' },
  { name: 'Gia Huy', xp: '860' },
] as const;

const cssVars = (vars: Record<string, string>) => vars as CSSProperties;

/** Màn Mưa từ thu nhỏ: nghĩa rơi bằng CSS (không canvas), máy bay bắn vào nghĩa đang khoá. */
function RainScene() {
  const { t } = useTranslation('marketing');
  return (
    <figure
      className="relative h-80 overflow-hidden sm:h-96 lg:absolute lg:inset-0 lg:h-auto"
      // Đo theo chiều cao khung để nghĩa rơi tới ngay trên thanh gõ dù khung cao bao nhiêu.
      style={cssVars({ containerType: 'size', '--rain-depth': 'calc(100cqh - 6rem)' })}
    >
      <div aria-hidden className="absolute inset-0">
        {DROPS.map(({ key, left, time, delay, rest }) => (
          <span
            key={key}
            className="landing-drop absolute top-0 rounded-full border border-game-glow/40 bg-game-panel px-3 py-1 text-small whitespace-nowrap text-game-ink"
            style={cssVars({
              left,
              '--rain-time': time,
              '--rain-delay': delay,
              '--rain-rest': rest,
            })}
          >
            {t(`gameSection.drops.${key}`)}
          </span>
        ))}
        <span className="landing-lock absolute top-[46%] left-1/2 -translate-x-1/2 rounded-full border border-highlight bg-game-panel px-4 py-1.5 font-medium whitespace-nowrap text-highlight">
          {t('sample.meaning')}
        </span>
        <span className="landing-caret absolute top-[calc(46%+2.5rem)] bottom-36 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-highlight" />
        <FighterJet className="absolute bottom-14 left-1/2 w-16 -translate-x-1/2 drop-shadow-[0_0_10px_var(--game-glow)]" />
        <div className="absolute inset-x-4 bottom-3 flex items-center gap-1 rounded-md border border-highlight/60 bg-game-panel px-4 py-2 font-card text-h3 tracking-wide text-highlight">
          rem
          <span className="landing-caret inline-block h-6 w-0.5 bg-highlight" />
        </div>
      </div>
      <figcaption className="sr-only">{t('gameSection.preview')}</figcaption>
    </figure>
  );
}

function IconChip({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary',
        className,
      )}
    >
      <Icon aria-hidden className="size-5" />
    </span>
  );
}

function SectionHeading({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex max-w-[65ch] flex-col gap-2">
      <h2 id={id} className="font-card text-h1">
        {title}
      </h2>
      <p className="text-text-muted">{description}</p>
    </div>
  );
}

function ModeCard({ modeKey, icon }: { modeKey: ModeKey; icon: LucideIcon }) {
  const { t } = useTranslation('marketing');
  return (
    <li className="glass-surface flex w-64 shrink-0 items-start gap-3 rounded-3xl p-4">
      <IconChip icon={icon} />
      <span className="flex min-w-0 flex-col">
        <span className="font-semibold">{t(`modes.${modeKey}.name`)}</span>
        <span className="text-small text-text-muted">{t(`modes.${modeKey}.description`)}</span>
      </span>
    </li>
  );
}

type FeatureId = 'xp' | 'streak' | 'badges' | 'leaderboard' | 'classes' | 'reminders';
type ModeKey = (typeof MODES)[number]['key'];

const tile = 'relative flex flex-col gap-3 rounded-3xl border border-border bg-bg p-5';

function FeatureText({ id }: { id: FeatureId }) {
  const { t } = useTranslation('marketing');
  return (
    <>
      <h3 className="text-h3">{t(`features.${id}.title`)}</h3>
      <p className="text-small text-text-muted">{t(`features.${id}.description`)}</p>
    </>
  );
}

export function LandingPage() {
  const { t } = useTranslation('marketing');
  return (
    <MarketingShell>
      <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-16 px-4 py-8 md:px-6 lg:gap-24 lg:px-8 lg:py-12">
        <section className="landing-sky landing-enter overflow-hidden rounded-sheet border border-game-glow/25 text-game-ink shadow-raised">
          <div className="grid lg:grid-cols-[1.1fr_1fr]">
            <div className="flex flex-col justify-center gap-6 p-6 sm:p-10 lg:p-12">
              <p className="flex w-fit items-center gap-2 rounded-full border border-game-glow/30 bg-game-panel px-3 py-1 text-small font-medium text-game-glow">
                <Sparkles aria-hidden className="size-4" />
                {t('hero.eyebrow')}
              </p>
              <h1 className="font-card text-card">{t('hero.title')}</h1>
              <p className="max-w-[60ch] text-game-ink-muted">
                {t('hero.description', { brand: BRAND_NAME })}
              </p>
              <div className="flex flex-wrap gap-2">
                <SessionLink
                  guest={{ href: '/register', label: t('start.guest') }}
                  member={{ href: '/dashboard', label: t('start.member') }}
                />
                <Button
                  asChild
                  variant="ghost"
                  className="border border-game-glow/40 bg-game-panel text-game-ink hover:bg-game-panel hover:text-highlight"
                >
                  <Link href="/explore">{t('hero.explore')}</Link>
                </Button>
              </div>
              <ul className="flex flex-wrap gap-2 text-small">
                {HIGHLIGHTS.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-game-glow/25 px-3 py-1 text-game-ink-muted"
                  >
                    {t(`highlights.${item}`)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative border-t border-game-glow/20 lg:border-t-0 lg:border-l">
              <RainScene />
            </div>
          </div>
          <ul className="grid divide-y divide-game-glow/20 border-t border-game-glow/20 bg-game-panel sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {GAME_POINTS.map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-center gap-3 px-6 py-4 text-small">
                <Icon aria-hidden className="size-5 shrink-0 text-game-glow" />
                {t(`gameSection.points.${key}`)}
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="modes-heading"
          className="glass-surface flex flex-col gap-6 overflow-hidden rounded-sheet py-6 sm:py-8"
        >
          <div className="px-6 sm:px-8">
            <SectionHeading
              id="modes-heading"
              title={t('modesSection.title')}
              description={t('modesSection.description')}
            />
          </div>
          <div className="landing-marquee overflow-hidden px-6 sm:px-8">
            <div className="landing-marquee-track flex w-max">
              <ul className="landing-marquee-list flex gap-3 pr-3">
                {MODES.map(({ key, icon }) => (
                  <ModeCard key={key} modeKey={key} icon={icon} />
                ))}
              </ul>
              <ul aria-hidden className="landing-marquee-copy flex gap-3 pr-3">
                {MODES.map(({ key, icon }) => (
                  <ModeCard key={key} modeKey={key} icon={icon} />
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="features-heading"
          className="landing-reveal glass-surface flex flex-col gap-6 rounded-sheet p-4 sm:p-8"
        >
          <div className="px-2 pt-2 sm:p-0">
            <SectionHeading
              id="features-heading"
              title={t('featuresSection.title')}
              description={t('featuresSection.description')}
            />
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <li className={cn(tile, 'sm:col-span-2')}>
              <span className="landing-float absolute top-5 right-5 rounded-full bg-highlight px-2.5 py-0.5 text-tiny font-semibold text-highlight-fg">
                {t('features.xp.gain')}
              </span>
              <IconChip icon={Zap} />
              <FeatureText id="xp" />
              <div className="mt-auto flex items-center gap-3">
                <span className="text-small font-semibold whitespace-nowrap text-primary">
                  {t('features.xp.level')}
                </span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-primary-soft">
                  <span className="landing-grow block h-full w-full rounded-full bg-primary" />
                </span>
              </div>
            </li>
            <li className={tile}>
              <Flame
                aria-hidden
                className="landing-flame size-10 fill-highlight/30 text-highlight"
              />
              <FeatureText id="streak" />
              <div className="mt-auto flex items-center gap-1.5" aria-hidden>
                {Array.from({ length: 7 }, (_, day) => (
                  <span
                    key={day}
                    className={cn('size-3 rounded-full', day < 5 ? 'bg-highlight' : 'bg-border')}
                  />
                ))}
              </div>
              <span className="text-small font-medium">{t('features.streak.days')}</span>
            </li>
            <li className={cn(tile, 'lg:row-span-2')}>
              <IconChip icon={Trophy} />
              <FeatureText id="leaderboard" />
              <ol className="mt-auto flex flex-col gap-2" aria-hidden>
                {LEADERS.map(({ name, xp }, index) => (
                  <li
                    key={xp}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-small',
                      name === null ? 'bg-primary-soft font-semibold text-primary' : 'bg-surface',
                    )}
                  >
                    <span className="tabular-nums">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate">
                      {name ?? t('features.leaderboard.you')}
                    </span>
                    <span className="tabular-nums">{xp} XP</span>
                  </li>
                ))}
              </ol>
            </li>
            <li className={tile}>
              <span className="flex -space-x-2" aria-hidden>
                {[Award, Star, Flame].map((Icon, index) => (
                  <span
                    key={index}
                    className="flex size-10 items-center justify-center rounded-full border-2 border-bg bg-primary-soft text-primary"
                  >
                    <Icon className="size-5" />
                  </span>
                ))}
              </span>
              <FeatureText id="badges" />
            </li>
            <li className={tile}>
              <IconChip icon={Users} />
              <FeatureText id="classes" />
            </li>
            <li className={tile}>
              <IconChip icon={BellRing} />
              <FeatureText id="reminders" />
            </li>
          </ul>
        </section>

        <section
          aria-labelledby="path-heading"
          className="landing-reveal flex flex-col gap-8 rounded-sheet border border-border-strong p-6 sm:p-8"
        >
          <SectionHeading
            id="path-heading"
            title={t('pathSection.title')}
            description={t('pathSection.description')}
          />
          <div className="relative">
            <span
              aria-hidden
              className="absolute top-5 right-[5%] left-[5%] hidden h-0.5 overflow-hidden rounded-full bg-border lg:block"
            >
              <span className="landing-sweep block h-full w-1/6 rounded-full bg-primary" />
            </span>
            <ol className="relative grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-5 lg:grid-cols-10">
              {MODES.map(({ key }, index) => (
                <li key={key} className="flex flex-col items-center gap-2 text-center">
                  <span
                    className={cn(
                      'flex size-10 items-center justify-center rounded-full border-2 border-primary font-semibold tabular-nums',
                      index === MODES.length - 1
                        ? 'bg-primary text-primary-fg'
                        : 'bg-bg text-primary',
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="text-small font-medium">{t(`modes.${key}.name`)}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          aria-labelledby="schedule-heading"
          className="landing-reveal glass-surface flex flex-col gap-6 rounded-sheet p-6 sm:p-8"
        >
          <div className="flex max-w-[65ch] flex-col gap-2">
            <h2 id="schedule-heading" className="flex items-start gap-2 font-card text-h1">
              <CalendarClock aria-hidden className="mt-1.5 size-7 shrink-0 text-primary" />
              {t('scheduleSection.title')}
            </h2>
            <p className="text-text-muted">{t('scheduleSection.description')}</p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SCHEDULE.map((step, index) => (
              <li key={step} className="flex flex-col gap-1 border-t-4 border-primary pt-3">
                <span className="text-small text-text-muted tabular-nums">
                  {t('scheduleSection.milestone', { number: index + 1 })}
                </span>
                <span className="text-h3">{t(`schedule.${step}.when`)}</span>
                <span className="text-text-muted">{t(`schedule.${step}.what`)}</span>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="start-heading"
          className="landing-reveal flex flex-col items-start gap-4 rounded-sheet bg-board p-8 text-board-fg md:p-12"
        >
          <h2 id="start-heading" className="font-card text-h1">
            {t('cta.title')}
          </h2>
          <p className="max-w-[65ch] text-board-muted">{t('cta.description')}</p>
          <SessionLink
            guest={{ href: '/register', label: t('start.guest') }}
            member={{ href: '/dashboard', label: t('start.member') }}
          />
        </section>
      </main>
    </MarketingShell>
  );
}
