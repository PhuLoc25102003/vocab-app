'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function JoinCodeBadge({ code, className }: { code: string; className?: string }) {
  const { t } = useTranslation('classes');
  const [copied, setCopied] = useState(false);
  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(t('copy.done', { code }));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('copy.failedManual'));
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={t('copy.label', { code })}
      aria-label={t('copy.label', { code })}
      className={cn(
        'glass-button relative z-20 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 font-mono text-tiny font-bold tracking-wider text-primary',
        className,
      )}
    >
      <span className="sr-only">{t('codeLabel')}</span>
      <span>{code}</span>
      {copied ? (
        <Check aria-hidden className="size-3.5 shrink-0 text-success" />
      ) : (
        <Copy aria-hidden className="size-3.5 shrink-0 opacity-80" />
      )}
    </button>
  );
}
