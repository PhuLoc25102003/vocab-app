'use client';

import {
  ClipboardCheck,
  GraduationCap,
  Headphones,
  Layers,
  ListChecks,
  Mic,
  PenLine,
  Route as Route2,
  Shuffle,
  TextCursorInput,
  type LucideIcon,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { STUDY_ENTRIES } from '../labels';
import { useTranslation } from 'react-i18next';

type StudySlug = (typeof STUDY_ENTRIES)[number]['slug'];

const ICONS: Record<StudySlug, LucideIcon> = {
  flashcard: Layers,
  learn: GraduationCap,
  write: PenLine,
  dictation: Headphones,
  mcq: ListChecks,
  cloze: TextCursorInput,
  match: Shuffle,
  test: ClipboardCheck,
  speak: Mic,
};

interface StudyModeGridProps {
  setId: string;
  /** Khách học thử ở trang công khai, không có lộ trình và không lưu tiến độ. */
  guest?: boolean;
  /** Giữ ngữ cảnh Khám phá cho các liên kết học. */
  fromExplore?: boolean;
}

/**
 * "Bắt đầu học" chạy lộ trình nhiều kỹ năng liên tiếp. Từng chế độ, kể cả Flashcard,
 * xếp thành lưới để học lẻ. Khách thấy nút "Học thử" bằng Flashcard thay cho lộ trình.
 */
export function StudyModeGrid({ setId, guest = false, fromExplore = false }: StudyModeGridProps) {
  const { t } = useTranslation('sets');
  const query = fromExplore ? '?from=explore' : '';
  const base = guest ? `/public/sets/${setId}/study` : `/sets/${setId}/study`;
  const href = (slug: string) => `${base}/${slug}${query}` as Route;
  const main = guest
    ? {
        href: href('flashcard'),
        icon: Layers,
        label: t('grid.guestLabel'),
        hint: t('grid.guestHint'),
      }
    : {
        href: `${base}/path${query}` as Route,
        icon: Route2,
        label: t('grid.pathLabel'),
        hint: t('grid.pathHint'),
      };
  const MainIcon = main.icon;

  return (
    <section
      aria-labelledby="study-modes-title"
      className="flex flex-col gap-4 rounded-xl border border-border-strong/70 bg-surface/80 p-4 sm:p-5 shadow-2xs backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="study-modes-title" className="text-h3 font-semibold text-text">
            {t('grid.title')}
          </h2>
          <p id="study-path-hint" className="text-small text-text-muted">
            {main.hint}
          </p>
        </div>
        <Button asChild>
          <Link href={main.href} aria-describedby="study-path-hint">
            <MainIcon aria-hidden className="size-4" />
            {main.label}
          </Link>
        </Button>
      </div>
      <ul className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STUDY_ENTRIES.map(({ slug }) => {
          const Icon = ICONS[slug];
          return (
            <li key={slug} className="flex">
              <Link
                href={href(slug)}
                className="group flex h-full w-full min-h-[84px] items-start gap-3.5 rounded-xl border border-border/80 bg-surface p-3.5 transition-all duration-fast ease-standard hover:border-primary hover:bg-primary-soft shadow-2xs"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary group-hover:bg-surface border border-primary/20">
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold text-body text-text group-hover:text-primary transition-colors">
                    {t(`modes.${slug}.label`)}
                  </span>
                  <span className="text-small text-text-muted leading-snug">
                    {t(`modes.${slug}.hint`)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
