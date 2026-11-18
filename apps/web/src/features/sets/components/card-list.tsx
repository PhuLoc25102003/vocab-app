import type { Card } from '@vocab/shared';
import { AudioButton } from '@/components/common/audio-button';

interface CardListProps {
  cards: Card[];
  termLang: string;
  defLang: string;
}

export function CardList({ cards, termLang, defLang }: CardListProps) {
  return (
    <ol className="border-t border-border">
      {cards.map(({ id, term, definition, phonetic, example }) => (
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
