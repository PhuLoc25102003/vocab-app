'use client';

import { Snail, Volume2 } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isSpeechSupported, speak } from '@/lib/speech';

interface AudioButtonProps {
  text: string;
  /** Mã BCP-47 của nội dung cần đọc. */
  lang: string;
  label: string;
  className?: string;
  /** Thêm nút nghe chậm cạnh nút nghe. */
  withSlow?: boolean;
}

const subscribe = () => () => undefined;
const getServerSnapshot = () => false;

export function useSpeechSupported(): boolean {
  return useSyncExternalStore(subscribe, isSpeechSupported, getServerSnapshot);
}

/** Trình duyệt không có Web Speech thì không hiện nút. */
export function AudioButton({ text, lang, label, className, withSlow = false }: AudioButtonProps) {
  const supported = useSpeechSupported();
  if (!supported) {
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
        aria-label={`${label} chậm`}
        title="Nghe chậm"
        onClick={() => speak(text, lang, { slow: true })}
      >
        <Snail aria-hidden className="size-5" />
      </Button>
    </span>
  );
}
