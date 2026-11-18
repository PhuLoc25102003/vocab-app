import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthFormSkeleton() {
  return (
    <LoadingState label="Đang tải biểu mẫu">
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
    </LoadingState>
  );
}
