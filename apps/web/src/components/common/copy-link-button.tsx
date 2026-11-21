'use client';

import { Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

/** `path` bắt đầu bằng dấu `/`, tên miền lấy từ trang đang mở. */
export function CopyLinkButton({ path }: { path: string }) {
  const { t } = useTranslation();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      toast.success(t('copyLink.done'));
    } catch {
      toast.error(t('copyLink.failed'));
    }
  };

  return (
    <Button variant="secondary" onClick={() => void copy()}>
      <Link2 aria-hidden className="size-4" />
      {t('copyLink.label')}
    </Button>
  );
}
