import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <LoadingState label="Đang tải trang">
      <Skeleton className="h-10 w-48 max-w-full" />
      <Skeleton className="h-6 w-full max-w-md" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </LoadingState>
  );
}
