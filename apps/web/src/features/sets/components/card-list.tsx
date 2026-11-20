import type { Card } from '@vocab/shared';
import type { ReactNode } from 'react';
import { AudioButton } from '@/components/common/audio-button';

interface CardListProps {
  cards: Card[];
  termLang: string;
  defLang: string;
  /** Thông tin thêm theo thẻ, ví dụ mức nhớ của người học, ghép ở tầng trang. */
  renderCardExtra?: (cardId: string) => ReactNode;
}

export function CardList({ cards, termLang, defLang, renderCardExtra }: CardListProps) {
  return (
    <ol className="border-t border-border">
      {cards.map(({ id, term, definition, phonetic, example, imageUrl }) => (
        <li
          key={id}
          className="grid gap-x-6 gap-y-1 border-b border-border py-4 [contain-intrinsic-size:auto_80px] [content-visibility:auto] sm:grid-cols-2"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p lang={termLang} className="min-w-0 font-card text-h3 break-words">
                {term}
              </p>
              <AudioButton text={term} lang={termLang} label={`Nghe phát âm ${term}`} />
            </div>
            {phonetic ? (
              <p className="font-phonetic text-small break-words text-text-muted">{phonetic}</p>
            ) : null}
            {renderCardExtra?.(id)}
            {imageUrl ? (
              // Ảnh nằm ở kho ảnh ngoài, không qua bộ tối ưu ảnh của Next.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={`Ảnh minh hoạ cho ${term}`}
                loading="lazy"
                className="mt-2 aspect-[4/3] w-32 rounded-md border border-border bg-bg object-cover"
              />
            ) : null}
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
        </li>
      ))}
    </ol>
  );
}
