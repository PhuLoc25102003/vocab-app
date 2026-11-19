import type { PublicSetSummary } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';

interface SetCardsProps {
  sets: PublicSetSummary[];
  hrefFor: (id: string) => Route;
}

/** Lưới bộ từ cộng đồng ở Khám phá, khác danh sách dòng kẻ của thư viện cá nhân. */
export function SetCards({ sets, hrefFor }: SetCardsProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sets.map(({ id, title, description, cardCount, owner }) => {
        const initial = owner.displayName.trim().charAt(0).toLocaleUpperCase('vi') || '?';
        return (
          <li
            key={id}
            className="relative flex flex-col gap-3 rounded-md border border-border-strong bg-surface p-4 transition-colors duration-fast ease-standard hover:border-primary hover:bg-primary-soft"
          >
            <Link
              href={hrefFor(id)}
              className="flex min-h-11 items-center text-h3 wrap-anywhere after:absolute after:inset-0 after:rounded-md"
            >
              {title}
            </Link>
            {description ? (
              <p className="line-clamp-2 text-small wrap-anywhere text-text-muted">{description}</p>
            ) : null}
            <div className="mt-auto flex items-center justify-between gap-3 text-small">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-tiny font-semibold text-primary-fg"
                >
                  {initial}
                </span>
                <span className="truncate">{owner.displayName}</span>
              </span>
              <span className="shrink-0 tabular-nums text-text-muted">{cardCount} thẻ</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
