'use client';

import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { listOfflineSets, type OfflineSet } from '@/lib/offline-store';

const dateFormat = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' });

/** Trang service worker trả về khi mất mạng, kèm các bộ từ đã tải về máy. */
export function OfflineNotice() {
  const [sets, setSets] = useState<OfflineSet[] | null>(null);

  useEffect(() => {
    listOfflineSets()
      .then(setSets)
      .catch(() => setSets([]));
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col items-start gap-4 px-4 py-16">
      <WifiOff aria-hidden className="size-10 text-primary" />
      <h1 className="text-h1">Bạn đang offline</h1>
      <p className="text-text-muted">
        Không kết nối được mạng nên chưa mở được trang này. Hãy kiểm tra Wi-Fi hoặc dữ liệu di động
        rồi thử lại.
      </p>
      <Button onClick={() => window.location.reload()}>Thử lại</Button>

      {sets && sets.length > 0 ? (
        <section aria-labelledby="offline-sets" className="flex w-full flex-col gap-3 pt-6">
          <h2 id="offline-sets" className="text-h2">
            Bộ từ đã tải về máy
          </h2>
          <ul className="flex flex-col gap-2">
            {sets.map(({ set, savedAt }) => (
              <li key={set.id}>
                <details className="rounded-md border border-border bg-surface px-4 py-2">
                  <summary className="flex min-h-11 cursor-pointer flex-wrap items-center justify-between gap-2">
                    <span className="font-medium wrap-anywhere">{set.title}</span>
                    <span className="text-small text-text-muted tabular-nums">
                      {set.cards.length} thẻ, tải ngày {dateFormat.format(new Date(savedAt))}
                    </span>
                  </summary>
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
