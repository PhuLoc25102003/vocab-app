import {
  ClipboardCheck,
  GraduationCap,
  Headphones,
  Layers,
  ListChecks,
  Mic,
  PenLine,
  Shuffle,
  TextCursorInput,
  type LucideIcon,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { STUDY_ENTRIES } from '../labels';

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

/** Một nút chính để bắt đầu nhanh, các chế độ còn lại xếp thành lưới có mô tả. */
export function StudyModeGrid({ setId }: { setId: string }) {
  const [primary, ...others] = STUDY_ENTRIES;
  const href = (slug: string) => `/sets/${setId}/study/${slug}` as Route;

  return (
    <section aria-labelledby="study-modes-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="study-modes-title" className="text-h2">
          Chọn cách học
        </h2>
        <Button asChild>
          <Link href={href(primary.slug)}>
            <Layers aria-hidden className="size-4" />
            {primary.label}
          </Link>
        </Button>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {others.map(({ slug, label, hint }) => {
          const Icon = ICONS[slug];
          return (
            <li key={slug}>
              <Link
                href={href(slug)}
                className="group flex min-h-16 items-start gap-3 rounded-md border border-border-strong bg-surface p-3 transition-colors duration-fast ease-standard hover:border-primary hover:bg-primary-soft"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary group-hover:bg-surface">
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium">{label}</span>
                  <span className="text-small text-text-muted">{hint}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
