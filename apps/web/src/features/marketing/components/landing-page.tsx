'use client';

import {
  CalendarClock,
  ClipboardCheck,
  GraduationCap,
  Headphones,
  Layers,
  ListChecks,
  Mic,
  PenLine,
  Shuffle,
  Sparkles,
  TextCursorInput,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { BRAND_NAME } from '@/components/common/logo';
import { SessionLink } from '@/components/common/session-link';
import { Button } from '@/components/ui/button';
import { MarketingShell } from './marketing-shell';
import { useTranslation } from 'react-i18next';

const MODES = [
  { key: 'flashcard', icon: Layers },
  { key: 'learn', icon: GraduationCap },
  { key: 'write', icon: PenLine },
  { key: 'dictation', icon: Headphones },
  { key: 'mcq', icon: ListChecks },
  { key: 'cloze', icon: TextCursorInput },
  { key: 'match', icon: Shuffle },
  { key: 'test', icon: ClipboardCheck },
  { key: 'speak', icon: Mic },
] as const satisfies readonly { key: string; icon: LucideIcon }[];

const SCHEDULE = ['today', 'day1', 'day6', 'later'] as const;
const STEPS = ['prepare', 'practice', 'review'] as const;
const HIGHLIGHTS = ['modes', 'schedule', 'free'] as const;

function SampleCards() {
  const { t } = useTranslation('marketing');
  return (
    <figure className="relative mx-auto flex h-72 w-full max-w-md items-center justify-center">
      <div
        aria-hidden
        className="landing-float-slow absolute top-2 left-4 flex h-32 w-52 -rotate-6 items-center justify-center rounded-lg border border-border bg-surface shadow-raised"
      >
        <span className="font-card text-h2 text-text-muted">vocabulary</span>
      </div>
      <div className="landing-float paper-grid relative flex h-44 w-72 flex-col items-center justify-center gap-1 rounded-lg border border-border shadow-raised">
        <span className="font-card text-card">remember</span>
        <span className="font-phonetic text-small text-text-muted">/rɪˈmem.bər/</span>
      </div>
      <div
        aria-hidden
        className="landing-float-slow absolute right-2 bottom-2 flex h-20 w-44 rotate-3 items-center justify-center rounded-lg bg-board text-board-fg shadow-raised"
      >
        <span className="font-card text-h3">{t('sample.meaning')}</span>
      </div>
      <figcaption className="sr-only">{t('sample.caption')}</figcaption>
    </figure>
  );
}

export function LandingPage() {
  const { t } = useTranslation('marketing');
  return (
    <MarketingShell>
      <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-24 px-4 py-12 md:px-6 lg:px-8 lg:py-20">
        <section className="grid items-center gap-12 lg:grid-cols-2">
          <div className="landing-enter flex max-w-[65ch] flex-col items-start gap-6">
            <p className="flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-small font-medium text-primary">
              <Sparkles aria-hidden className="size-4" />
              {t('hero.eyebrow')}
            </p>
            <h1 className="font-card text-card">{t('hero.title')}</h1>
            <p className="text-text-muted">{t('hero.description', { brand: BRAND_NAME })}</p>
            <div className="flex flex-wrap gap-2">
              <SessionLink
                guest={{ href: '/register', label: t('start.guest') }}
                member={{ href: '/dashboard', label: t('start.member') }}
              />
              <Button asChild variant="secondary">
                <Link href="/explore">{t('hero.explore')}</Link>
              </Button>
            </div>
            <ul className="flex flex-wrap gap-2 text-small">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="rounded-full border border-border-strong px-3 py-1">
                  {t(`highlights.${item}`)}
                </li>
              ))}
            </ul>
          </div>
          <SampleCards />
        </section>

        <section aria-labelledby="modes-heading" className="landing-reveal flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 id="modes-heading" className="text-h2">
              {t('modesSection.title')}
            </h2>
            <p className="max-w-[65ch] text-text-muted">{t('modesSection.description')}</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODES.map(({ key, icon: Icon }) => (
              <li
                key={key}
                className="flex items-start gap-3 rounded-md border border-border bg-surface p-4 transition-colors duration-fast ease-standard hover:border-primary"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="flex flex-col">
                  <span className="font-card text-h3">{t(`modes.${key}.name`)}</span>
                  <span className="text-small text-text-muted">
                    {t(`modes.${key}.description`)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="schedule-heading" className="landing-reveal flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 id="schedule-heading" className="flex items-center gap-2 text-h2">
              <CalendarClock aria-hidden className="size-6 text-primary" />
              {t('scheduleSection.title')}
            </h2>
            <p className="max-w-[65ch] text-text-muted">{t('scheduleSection.description')}</p>
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

        <section aria-labelledby="steps-heading" className="landing-reveal flex flex-col gap-6">
          <h2 id="steps-heading" className="text-h2">
            {t('stepsSection.title')}
          </h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span
                  aria-hidden
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary font-card text-h2 text-primary-fg"
                >
                  {index + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="sr-only">{t('stepsSection.step', { number: index + 1 })}</span>
                  <h3 className="text-h3">{t(`steps.${step}.title`)}</h3>
                  <p className="text-text-muted">{t(`steps.${step}.description`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="start-heading"
          className="landing-reveal flex flex-col items-start gap-4 rounded-lg bg-board p-8 text-board-fg md:p-12"
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
