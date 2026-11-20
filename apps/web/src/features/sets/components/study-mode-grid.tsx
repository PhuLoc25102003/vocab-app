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
}

/**
 * "Bắt đầu học" chạy lộ trình nhiều kỹ năng liên tiếp. Từng chế độ, kể cả Flashcard,
 * xếp thành lưới để học lẻ. Khách thấy nút "Học thử" bằng Flashcard thay cho lộ trình.
 */
export function StudyModeGrid({ setId, guest = false }: StudyModeGridProps) {
  const base = guest ? `/public/sets/${setId}/study` : `/sets/${setId}/study`;
  const href = (slug: string) => `${base}/${slug}` as Route;
  const main = guest
    ? {
        href: href('flashcard'),
        icon: Layers,
        label: 'Học thử',
        hint: 'Học thử không cần tài khoản. Đăng nhập để lưu tiến độ và học theo lộ trình.',
      }
    : {
        href: href('path'),
        icon: Route2,
        label: 'Bắt đầu học',
        hint: 'Bắt đầu học: xem thẻ → trắc nghiệm → ghép cặp → luyện viết, nối tiếp nhau.',
      };
  const MainIcon = main.icon;

  return (
    <section aria-labelledby="study-modes-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="study-modes-title" className="text-h2">
            Chọn cách học
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
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {STUDY_ENTRIES.map(({ slug, label, hint }) => {
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
