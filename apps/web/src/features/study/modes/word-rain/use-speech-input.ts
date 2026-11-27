'use client';

import { useEffect, useRef, useState } from 'react';
import { loadSpeechSettings } from '@/lib/speech';
import { listenOnce, ListenError, type ListenFailure } from '@/lib/speech-recognition';

/**
 * Nghe liên tục cho kiểu Nói của Mưa từ: gọi `listenOnce` lặp lại khi đang chơi, mỗi lần nghe được
 * thì đưa mọi câu nhận dạng (câu chắc nhất trước) cho trò chơi. Im lặng thì nghe tiếp; bị chặn micro
 * hoặc trình duyệt không hỗ trợ thì dừng và báo lỗi để người học chuyển sang kiểu Gõ.
 */
export function useSpeechInput({
  active,
  lang,
  onTranscripts,
}: {
  active: boolean;
  lang: string;
  onTranscripts: (transcripts: string[]) => void;
}) {
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [error, setError] = useState<ListenFailure | null>(null);
  const handler = useRef(onTranscripts);
  useEffect(() => {
    handler.current = onTranscripts;
  }, [onTranscripts]);

  useEffect(() => {
    if (!active || error) return;
    const controller = new AbortController();
    let stopped = false;
    const run = async () => {
      while (!stopped) {
        setListening(true);
        try {
          // Giống Luyện nói: tiếng Anh nghe theo giọng đã chọn trong cài đặt, ngôn ngữ khác theo bộ từ.
          const recognitionLang = lang === 'en' ? (loadSpeechSettings().accent ?? 'en-US') : lang;
          const transcripts = await listenOnce(recognitionLang, controller.signal);
          setHeard(transcripts[0] ?? '');
          handler.current(transcripts);
        } catch (caught) {
          const reason = caught instanceof ListenError ? caught.reason : 'failed';
          if (reason === 'aborted') break;
          if (reason !== 'no-speech') {
            setError(reason);
            break;
          }
        }
      }
      setListening(false);
    };
    void run();
    return () => {
      stopped = true;
      controller.abort();
    };
  }, [active, error, lang]);

  return { listening: active && listening, heard, error };
}
