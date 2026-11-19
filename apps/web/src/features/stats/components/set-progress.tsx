'use client';

import { useQuery } from '@tanstack/react-query';
import type { Route } from 'next';
import Link from 'next/link';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getSetProgress } from '../api';

export function SetProgressSummary({ setId }: { setId: string }) {
  const progress = useQuery({
    queryKey: ['stats', 'set', setId],
    queryFn: () => getSetProgress(setId),
    staleTime: 0,
  });

  if (progress.isPending) {
    return (
      <LoadingState label="Đang tải tiến độ">
        <Skeleton className="h-16 w-full" />
      </LoadingState>
    );
  }
  if (progress.isError) {
    return (
      <ErrorState
        title="Không tải được tiến độ"
        description="Hãy kiểm tra mạng rồi thử lại."
        onRetry={() => void progress.refetch()}
      />
    );
  }

  const { total, mastered, learning, notStarted, due } = progress.data;
  if (notStarted === total) {
    return <p className="text-text-muted">Bạn chưa học thẻ nào trong bộ từ này.</p>;
  }

  const items = [
    { label: 'Đã thuộc', value: mastered },
    { label: 'Đang học', value: learning },
    { label: 'Chưa học', value: notStarted },
  ];

  return (
    <section aria-label="Tiến độ của bạn" className="flex flex-wrap items-center gap-x-10 gap-y-3">
      <dl className="flex flex-wrap gap-x-10 gap-y-3">
        {items.map(({ label, value }) => (
          <div key={label} className="flex flex-col-reverse">
            <dt className="text-small text-text-muted">{label}</dt>
            <dd className="text-h2 tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {due > 0 ? (
        <Button asChild variant="secondary">
          <Link href={`/sets/${setId}/study/flashcard?due=1` as Route}>Ôn {due} thẻ đến hạn</Link>
        </Button>
      ) : null}
    </section>
  );
}
