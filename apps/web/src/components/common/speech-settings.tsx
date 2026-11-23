'use client';

import { Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  DEFAULT_SPEECH_SETTINGS,
  hasExactVoice,
  isNativeSpeechSupported,
  isSpeechSupported,
  loadSpeechSettings,
  saveSpeechSettings,
  speak,
  type Accent,
  type SpeechRate,
  type SpeechSettings as Settings,
} from '@/lib/speech';
import {
  isSoundSupported,
  loadSoundEnabled,
  playCorrectSound,
  saveSoundEnabled,
} from '@/lib/sound';
import { useTranslation } from 'react-i18next';

const SAMPLE = 'Practice makes perfect.';

/** Chọn giọng Anh Mỹ hoặc Anh Anh và tốc độ đọc, lưu trên thiết bị. */
export function SpeechSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SPEECH_SETTINGS);
  const [exact, setExact] = useState(true);
  const [sound, setSound] = useState(true);
  const [soundSupported, setSoundSupported] = useState(false);

  useEffect(() => {
    // Đọc lựa chọn đã lưu sau khi hiện để HTML từ máy chủ và trình duyệt giống nhau.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chỉ đọc localStorage một lần
    setSettings(loadSpeechSettings());
    setSound(loadSoundEnabled());
    setSoundSupported(isSoundSupported());
  }, []);

  useEffect(() => {
    if (!isNativeSpeechSupported() || typeof window.speechSynthesis === 'undefined') return;
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
      className="flex w-full flex-col gap-4 rounded-lg border border-border bg-surface p-4 sm:p-5"
    >
      <h2 id="speech-title" className="text-h3">
        {t('speech.title')}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-small font-medium">
          {t('speech.accent')}
          <Select
            value={settings.accent}
            onChange={(event) => update({ accent: event.target.value as Accent })}
          >
            <option value="en-GB">{t('speech.gb')}</option>
            <option value="en-US">{t('speech.us')}</option>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-small font-medium">
          {t('speech.rate')}
          <Select
            value={settings.rate}
            onChange={(event) => update({ rate: event.target.value as SpeechRate })}
          >
            <option value="normal">{t('speech.normal')}</option>
            <option value="slow">{t('speech.slow')}</option>
          </Select>
        </label>
      </div>
      {!exact ? (
        <p role="status" className="text-small text-text-muted">
          {t('speech.missingVoice', {
            accent: t(settings.accent === 'en-GB' ? 'speech.gb' : 'speech.us'),
          })}
        </p>
      ) : null}
      <div>
        <Button type="button" variant="secondary" onClick={() => speak(SAMPLE, 'en')}>
          <Volume2 aria-hidden className="size-4" />
          {t('speech.tryIt')}
        </Button>
      </div>
      {soundSupported ? (
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <span className="flex min-w-0 flex-col">
            <span id="sound-label" className="font-medium">
              {t('speech.sound')}
            </span>
            <span id="sound-hint" className="text-small text-text-muted">
              {t('speech.soundHint')}
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={sound}
            aria-labelledby="sound-label"
            aria-describedby="sound-hint"
            onClick={() => {
              const enabled = !sound;
              setSound(enabled);
              saveSoundEnabled(enabled);
              if (enabled) playCorrectSound();
            }}
            className="group flex size-11 shrink-0 items-center justify-center rounded-full"
          >
            <span
              aria-hidden
              className={cn(
                'flex h-6 w-10 items-center rounded-full border-2 p-0.5 transition-colors duration-fast ease-standard',
                sound ? 'border-primary bg-primary' : 'border-border-strong bg-surface',
              )}
            >
              <span
                className={cn(
                  'size-4 rounded-full transition-transform duration-fast ease-standard motion-reduce:transition-none',
                  sound ? 'translate-x-4 bg-primary-fg' : 'bg-text-muted',
                )}
              />
            </span>
          </button>
        </div>
      ) : null}
    </section>
  );
}
