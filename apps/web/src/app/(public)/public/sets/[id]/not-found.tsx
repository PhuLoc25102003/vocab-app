import Link from 'next/link';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';

export default function PublicSetNotFound() {
  return (
    <EmptyState
      title="Không tìm thấy bộ từ"
      description="Bộ từ này không tồn tại hoặc không còn công khai."
      action={
        <Button asChild variant="secondary">
          <Link href="/">Về trang chủ</Link>
        </Button>
      }
    />
  );
}
