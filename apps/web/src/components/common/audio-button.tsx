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

  const pillClass = 'min-h-11 rounded-full px-3 text-small sm:px-4 sm:text-body shrink-0';

  const normal = (
    <Button
      type="button"
      variant="secondary"
      aria-label={label}
      className={cn(pillClass, className)}
      onClick={() => speak(text, lang)}
    >
      <Volume2 aria-hidden className="size-4 shrink-0 sm:size-5" />
      <span>{t('audio.listen')}</span>
    </Button>
  );
  if (!withSlow) {
    return normal;
  }
  return (
    <span className="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2">
      {normal}
      <Button
        type="button"
        variant="secondary"
        aria-label={`${t('audio.slowLabel')} (${label})`}
        title={t('audio.slowTitle')}
        className={cn(pillClass, className)}
        onClick={() => speak(text, lang, { slow: true })}
      >
        <Snail aria-hidden className="size-4 shrink-0 sm:size-5" />
        <span>{t('audio.slowLabel')}</span>
      </Button>
    </span>
  );
}
