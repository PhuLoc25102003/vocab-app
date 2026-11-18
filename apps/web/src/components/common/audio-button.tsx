'use client';

import { Volume2 } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { isSpeechSupported, speak } from '@/lib/speech';

interface AudioButtonProps {
  text: string;
  /** Mã BCP-47 của nội dung cần đọc. */
  lang: string;
  label: string;
  className?: string;
}

const subscribe = () => () => undefined;
const getServerSnapshot = () => false;

export function useSpeechSupported(): boolean {
  return useSyncExternalStore(subscribe, isSpeechSupported, getServerSnapshot);
}

/** Trình duyệt không có Web Speech thì không hiện nút. */
export function AudioButton({ text, lang, label, className }: AudioButtonProps) {
  const supported = useSpeechSupported();
  if (!supported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      className={className}
      onClick={() => speak(text, lang)}
    >
      <Volume2 aria-hidden className="size-5" />
    </Button>
  );
}
