import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';

export function SetDetailSkeleton() {
  return (
    <LoadingState label="Đang tải bộ từ">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64 max-w-full" />
        <Skeleton className="h-6 w-48 max-w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </LoadingState>
  );
}
