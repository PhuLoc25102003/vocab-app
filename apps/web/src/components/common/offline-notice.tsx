'use client';

import type { SetDetail } from '@vocab/shared';
import { WifiOff } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { listOfflineSets, type OfflineSet } from '@/lib/offline-store';
import { useTranslation } from 'react-i18next';

const formatSavedDate = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);

/** Trang service worker trả về khi mất mạng, kèm các bộ từ đã tải về máy. */
export function OfflineNotice({
  renderSetAction,
}: {
  /** Hành động cho từng bộ đã tải, ví dụ học offline. */
  renderSetAction?: (setId: string, set?: SetDetail) => ReactNode;
} = {}) {
  const { t, i18n } = useTranslation();
  const [sets, setSets] = useState<OfflineSet[] | null>(null);

  useEffect(() => {
    listOfflineSets()
      .then(setSets)
      .catch(() => setSets([]));
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col items-start gap-4 px-4 py-16">
      <WifiOff aria-hidden className="size-10 text-primary" />
      <h1 className="text-h1">{t('offline.title')}</h1>
      <p className="text-text-muted">{t('offline.description')}</p>
      <Button onClick={() => window.location.reload()}>{t('actions.retry')}</Button>

      {sets && sets.length > 0 ? (
        <section aria-labelledby="offline-sets" className="flex w-full flex-col gap-3 pt-6">
          <h2 id="offline-sets" className="text-h2">
            {t('offline.savedSets')}
          </h2>
          <ul className="flex flex-col gap-2">
            {sets.map(({ set, savedAt }) => (
              <li key={set.id}>
                <details className="rounded-md border border-border bg-surface px-4 py-2">
                  <summary className="flex min-h-11 cursor-pointer flex-wrap items-center justify-between gap-2">
                    <span className="font-medium wrap-anywhere">{set.title}</span>
                    <span className="text-small text-text-muted tabular-nums">
                      {t('offline.savedMeta', {
                        count: set.cards.length,
                        date: formatSavedDate(new Date(savedAt), i18n.language),
                      })}
                    </span>
                  </summary>
                  {renderSetAction ? (
                    <div className="py-2">{renderSetAction(set.id, set)}</div>
                  ) : null}
                  <ol className="border-t border-border">
                    {set.cards.map((card) => (
                      <li
                        key={card.id}
                        className="grid gap-x-4 border-b border-border py-2 sm:grid-cols-2"
                      >
                        <span lang={set.termLang} className="font-card wrap-anywhere">
                          {card.term}
                        </span>
                        <span lang={set.defLang} className="text-text-muted wrap-anywhere">
                          {card.definition}
                        </span>
                      </li>
                    ))}
                  </ol>
                </details>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
