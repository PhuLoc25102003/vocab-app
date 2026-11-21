'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

const SLOW_AFTER_MS = 3_000;

interface LoadingStateProps {
  /** Tên nội dung cho trình đọc màn hình, ví dụ "Đang tải bộ từ". */
  label: string;
  /** Skeleton đúng hình nội dung. */
  children: ReactNode;
}

export function LoadingState({ label, children }: LoadingStateProps) {
  const { t } = useTranslation();
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div role="status" aria-label={label} className="flex flex-col gap-4">
      {children}
      {isSlow ? <p className="text-small text-text-muted">{t('loading.slowServer')}</p> : null}
    </div>
  );
}
