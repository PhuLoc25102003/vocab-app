'use client';

import { Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
  DEFAULT_SPEECH_SETTINGS,
  hasExactVoice,
  isSpeechSupported,
  loadSpeechSettings,
  saveSpeechSettings,
  speak,
  type Accent,
  type SpeechRate,
  type SpeechSettings as Settings,
} from '@/lib/speech';

const SAMPLE = 'Practice makes perfect.';

/** Chọn giọng Anh Mỹ hoặc Anh Anh và tốc độ đọc, lưu trên thiết bị. */
export function SpeechSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SPEECH_SETTINGS);
  const [exact, setExact] = useState(true);

  useEffect(() => {
    // Đọc lựa chọn đã lưu sau khi hiện để HTML từ máy chủ và trình duyệt giống nhau.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chỉ đọc localStorage một lần
    setSettings(loadSpeechSettings());
  }, []);

  useEffect(() => {
    if (!isSpeechSupported()) return;
    // Danh sách giọng của trình duyệt có thể tải sau.
    const check = () => setExact(hasExactVoice(settings.accent));
    check();
    window.speechSynthesis.addEventListener('voiceschanged', check);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', check);
  }, [settings.accent]);

  const update = (next: Partial<Settings>) => {
    const merged = { ...settings, ...next };
    setSettings(merged);
    saveSpeechSettings(merged);
  };

  return (
    <section
      aria-labelledby="speech-title"
      className="flex w-full flex-col gap-4 border-t border-border pt-6"
    >
      <h2 id="speech-title" className="text-h2">
        Giọng đọc
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-small font-medium">
          Giọng tiếng Anh
          <Select
            value={settings.accent}
            onChange={(event) => update({ accent: event.target.value as Accent })}
          >
            <option value="en-US">Anh Mỹ</option>
            <option value="en-GB">Anh Anh</option>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-small font-medium">
          Tốc độ đọc
          <Select
            value={settings.rate}
            onChange={(event) => update({ rate: event.target.value as SpeechRate })}
          >
            <option value="normal">Bình thường</option>
            <option value="slow">Chậm</option>
          </Select>
        </label>
      </div>
      {!exact ? (
        <p role="status" className="text-small text-text-muted">
          Máy này chưa có giọng {settings.accent === 'en-GB' ? 'Anh Anh' : 'Anh Mỹ'}, trình duyệt sẽ
          dùng giọng tiếng Anh khác.
        </p>
      ) : null}
      <div>
        <Button type="button" variant="secondary" onClick={() => speak(SAMPLE, 'en')}>
          <Volume2 aria-hidden className="size-4" />
          Nghe thử
        </Button>
      </div>
    </section>
  );
}
