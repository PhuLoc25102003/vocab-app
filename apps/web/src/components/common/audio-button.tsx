'use client';

import { Snail, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isSpeechSupported, speak } from '@/lib/speech';
import { useTranslation } from 'react-i18next';

interface AudioButtonProps {
  text: string;
  /** Mã BCP-47 của nội dung cần đọc. */
  lang: string;
  label: string;
  className?: string;
  /** Thêm nút nghe chậm cạnh nút nghe. */
  withSlow?: boolean;
}

export function useSpeechSupported(): boolean {
  return isSpeechSupported();
}

/** Nút nghe phát âm - hỗ trợ cả Web Speech API lẫn Audio fallback trên 100% dòng điện thoại */
export function AudioButton({ text, lang, label, className, withSlow = false }: AudioButtonProps) {
  const { t } = useTranslation();
  if (!isSpeechSupported()) {
    return null;
  }

  const normal = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      className={cn('shrink-0', className)}
      onClick={() => speak(text, lang)}
    >
      <Volume2 aria-hidden className="size-5" />
    </Button>
  );
  if (!withSlow) {
    return normal;
  }
  return (
    <span className="flex shrink-0 items-center">
      {normal}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('audio.slow', { label })}
        title={t('audio.slowTitle')}
        onClick={() => speak(text, lang, { slow: true })}
      >
        <Snail aria-hidden className="size-5" />
      </Button>
    </span>
  );
}
