'use client';

import type { Card } from '@vocab/shared';
import { useRef, useState, type ReactNode } from 'react';
import { AudioButton } from '@/components/common/audio-button';
import { CardImage } from '@/components/common/card-image';
import { Pagination } from '@/components/common/pagination';
import { useTranslation } from 'react-i18next';

/** Bộ có thể tới 2.000 thẻ, chỉ hiện 50 thẻ một lần. */
export const CARDS_PAGE_SIZE = 50;

interface CardListProps {
  cards: Card[];
  termLang: string;
  defLang: string;
  /** Thông tin thêm theo thẻ, ví dụ mức nhớ của người học, ghép ở tầng trang. */
  renderCardExtra?: (cardId: string) => ReactNode;
}

export function CardList({ cards, termLang, defLang, renderCardExtra }: CardListProps) {
  const { t } = useTranslation('sets');
  const [requested, setRequested] = useState(1);
  const listRef = useRef<HTMLOListElement>(null);
  const pageCount = Math.max(1, Math.ceil(cards.length / CARDS_PAGE_SIZE));
  // Bộ ít thẻ đi (xoá thẻ) thì không đứng ở trang không còn tồn tại.
  const page = Math.min(requested, pageCount);
  const first = (page - 1) * CARDS_PAGE_SIZE;
  const visible = cards.slice(first, first + CARDS_PAGE_SIZE);

  const goTo = (next: number) => {
    setRequested(next);
    // Danh sách nằm giữa trang: đưa người học về thẻ đầu của trang mới.
    listRef.current?.scrollIntoView({ block: 'start' });
  };

  return (
    <div className="flex flex-col gap-4">
      <ol
        ref={listRef}
        start={first + 1}
        aria-label={
          pageCount > 1
            ? t('list.range', { from: first + 1, to: first + visible.length, total: cards.length })
            : undefined
        }
        className="scroll-mt-20 border-t border-border"
      >
        {visible.map(({ id, term, definition, phonetic, example, imageUrl }) => (
          <li
            key={id}
            className="border-b border-border py-4 [contain-intrinsic-size:auto_80px] [content-visibility:auto]"
          >
            <div className="flex items-start justify-between gap-4 sm:items-center sm:gap-6">
              <div className="grid flex-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p lang={termLang} className="min-w-0 font-card text-h3 break-words">
                      {term}
                    </p>
                    <AudioButton text={term} lang={termLang} label={t('list.listen', { term })} />
                    {phonetic ? (
                      <span className="font-phonetic text-small break-words text-text-muted">
                        {phonetic}
                      </span>
                    ) : null}
                  </div>
                  {renderCardExtra?.(id)}
                </div>
                <div className="min-w-0">
                  <p lang={defLang} className="break-words whitespace-pre-line">
                    {definition}
                  </p>
                  {example ? (
                    <p
                      lang={termLang}
                      className="text-small break-words whitespace-pre-line text-text-muted"
                    >
                      {example}
                    </p>
                  ) : null}
                </div>
              </div>
              {imageUrl ? (
                <div className="shrink-0">
                  <CardImage
                    src={imageUrl}
                    alt={t('list.imageAlt', { term })}
                    className="aspect-[4/3] w-20 rounded-md sm:w-28"
                  />
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      <Pagination page={page} pageCount={pageCount} onPageChange={goTo} />
    </div>
  );
}
