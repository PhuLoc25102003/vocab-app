export type Accent = 'en-US' | 'en-GB';
export type SpeechRate = 'normal' | 'slow';

export interface SpeechSettings {
  accent: Accent;
  rate: SpeechRate;
}

export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = { accent: 'en-US', rate: 'normal' };
const RATES: Record<SpeechRate, number> = { normal: 1, slow: 0.7 };
const STORAGE_KEY = 'vocab.speech';

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Lựa chọn giọng lưu trên thiết bị. Không đọc được thì dùng mặc định. */
export function loadSpeechSettings(): SpeechSettings {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (saved && typeof saved === 'object') {
      const { accent, rate } = saved as Record<string, unknown>;
      return {
        accent: accent === 'en-GB' ? 'en-GB' : 'en-US',
        rate: rate === 'slow' ? 'slow' : 'normal',
      };
    }
  } catch {
    // Chế độ riêng tư hoặc dữ liệu hỏng: dùng mặc định.
  }
  return DEFAULT_SPEECH_SETTINGS;
}

export function saveSpeechSettings(settings: SpeechSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Không lưu được thì chỉ áp dụng trong phiên này.
  }
}

/** Nội dung tiếng Anh đọc theo giọng người dùng chọn, ngôn ngữ khác giữ nguyên. */
function targetLang(lang: string, accent: Accent): string {
  return lang.toLowerCase().startsWith('en') ? accent : lang;
}

/** Giọng có trên máy khớp đúng mã, không có thì khớp ngôn ngữ chính. */
export function findVoice(lang: string): SpeechSynthesisVoice | undefined {
  if (!isSpeechSupported()) return undefined;
  const voices = window.speechSynthesis.getVoices?.() ?? [];
  const wanted = lang.toLowerCase();
  return (
    voices.find((voice) => voice.lang.toLowerCase().replace('_', '-') === wanted) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(wanted.split('-')[0] ?? wanted))
  );
}

/** Máy có giọng đúng giọng địa phương đã chọn không, để báo khi phải dùng giọng khác. */
export function hasExactVoice(lang: string): boolean {
  const voice = findVoice(lang);
  return voice?.lang.toLowerCase().replace('_', '-') === lang.toLowerCase();
}

export function speak(text: string, lang = 'en-US', options: { slow?: boolean } = {}) {
  if (!isSpeechSupported()) {
    return;
  }
  const settings = loadSpeechSettings();
  const target = targetLang(lang, settings.accent);
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = target;
  const voice = findVoice(target);
  if (voice) {
    utterance.voice = voice;
  }
  utterance.rate = options.slow ? RATES.slow : RATES[settings.rate];
  window.speechSynthesis.speak(utterance);
}
