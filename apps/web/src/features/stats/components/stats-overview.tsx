'use client';

import { useQuery } from '@tanstack/react-query';
import type { Route } from 'next';
import Link from 'next/link';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatsOverview } from '../api';

export function StatsOverview() {
  const stats = useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: getStatsOverview,
    staleTime: 0,
  });

  if (stats.isPending) {
    return (
      <LoadingState label="Đang tải thống kê">
        <Skeleton className="h-20 w-full" />
      </LoadingState>
    );
  }
  if (stats.isError) {
    return (
      <ErrorState
        title="Không tải được thống kê"
        description="Hãy kiểm tra mạng rồi thử lại."
        onRetry={() => void stats.refetch()}
      />
    );
  }

  const { streakDays, masteredCards, answersToday, dueCards, hardCards } = stats.data;
  if (
    streakDays === 0 &&
    masteredCards === 0 &&
    answersToday === 0 &&
    dueCards === 0 &&
    hardCards.length === 0
  ) {
    return (
      <EmptyState
        title="Chưa có số liệu học tập"
        description="Học một bộ từ để bắt đầu chuỗi ngày học."
        action={
          <Button asChild variant="secondary">
            <Link href="/explore">Tìm bộ từ để học</Link>
          </Button>
        }
      />
    );
  }

  const items = [
    { label: 'Ngày học liên tiếp', value: streakDays },
    { label: 'Từ đã thuộc', value: masteredCards },
    { label: 'Câu trả lời hôm nay', value: answersToday },
  ];

  return (
    <section aria-labelledby="stats-heading" className="flex flex-col gap-4">
      <h2 id="stats-heading" className="text-h2">
        Thống kê
      </h2>
      {dueCards > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>
            Bạn có <span className="font-semibold tabular-nums">{dueCards}</span> thẻ đến hạn ôn.
          </p>
          <Button asChild>
            <Link href="/review">Ôn ngay</Link>
          </Button>
        </div>
      ) : null}
      <dl className="flex flex-wrap gap-x-10 gap-y-3 border-y border-border py-4">
        {items.map(({ label, value }) => (
          <div key={label} className="flex flex-col-reverse">
            <dt className="text-small text-text-muted">{label}</dt>
            <dd className="text-h1 tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      {hardCards.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-h3">Từ hay sai</h3>
          <ul className="border-t border-border">
            {hardCards.map(({ cardId, setId, term, definition, wrongCount }) => (
              <li
                key={cardId}
                className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-border py-3"
              >
                <Link
                  href={`/sets/${setId}` as Route}
                  className="inline-flex min-h-11 items-center font-card break-words"
                >
                  {term}
                </Link>
                <span className="min-w-0 flex-1 break-words text-text-muted">{definition}</span>
                <span className="text-small tabular-nums">Sai {wrongCount} lần</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
