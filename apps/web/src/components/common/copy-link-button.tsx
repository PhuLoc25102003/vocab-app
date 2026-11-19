'use client';

import { Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

/** `path` bắt đầu bằng dấu `/`, tên miền lấy từ trang đang mở. */
export function CopyLinkButton({ path }: { path: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      toast.success('Đã sao chép đường dẫn');
    } catch {
      toast.error('Không sao chép được. Hãy mở trang công khai rồi sao chép từ thanh địa chỉ.');
    }
  };

  return (
    <Button variant="secondary" onClick={() => void copy()}>
      <Link2 aria-hidden className="size-4" />
      Sao chép đường dẫn
    </Button>
  );
}
