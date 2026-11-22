export type Accent = 'en-US' | 'en-GB';
export type SpeechRate = 'normal' | 'slow';

export interface SpeechSettings {
  accent: Accent;
  rate: SpeechRate;
}

export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = { accent: 'en-GB', rate: 'normal' };
const RATES: Record<SpeechRate, number> = { normal: 1, slow: 0.7 };
const STORAGE_KEY = 'vocab.speech';

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Lựa chọn giọng lưu trên thiết bị. Không đọc được thì dùng mặc định (Anh - Anh). */
export function loadSpeechSettings(): SpeechSettings {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (saved && typeof saved === 'object') {
      const { accent, rate } = saved as Record<string, unknown>;
      return {
        accent: accent === 'en-US' ? 'en-US' : 'en-GB',
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

/** Ưu tiên giọng tự nhiên AI (Natural/Neural/Online/Google), phát âm chuẩn và rõ ràng */
function scoreVoice(
  voice: { lang: string; name: string; default?: boolean },
  wanted: string,
): number {
  const voiceLang = voice.lang.toLowerCase().replace('_', '-');
  const name = voice.name.toLowerCase();
  let score = 0;

  if (voiceLang === wanted) {
    score += 100;
  } else if (voiceLang.startsWith(wanted.split('-')[0] ?? wanted)) {
    score += 50;
  } else {
    return -1;
  }

  // Ưu tiên giọng đọc Natural / Neural / Online chất lượng cao (Edge Azure TTS)
  if (name.includes('natural') || name.includes('neural') || name.includes('online')) {
    score += 40;
  } else if (name.includes('google')) {
    // Giọng Google chất lượng cao (Chrome TTS)
    score += 30;
  }

  // Giọng nữ hoặc tên giọng Anh bản xứ phổ biến rõ ràng
  if (
    name.includes('female') ||
    name.includes('sonia') ||
    name.includes('libby') ||
    name.includes('hazel')
  ) {
    score += 5;
  }

  if (voice.default) {
    score += 2;
  }

  return score;
}

/** Giọng có trên máy khớp đúng mã, ưu tiên giọng AI tự nhiên rõ ràng. */
export function findVoice(lang: string): SpeechSynthesisVoice | undefined {
  if (!isSpeechSupported()) return undefined;
  const voices = window.speechSynthesis.getVoices?.() ?? [];
  const wanted = lang.toLowerCase();

  let bestVoice: SpeechSynthesisVoice | undefined;
  let bestScore = -1;

  for (const voice of voices) {
    const score = scoreVoice(voice, wanted);
    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    }
  }

  return bestVoice;
}

/** Máy có giọng đúng giọng địa phương đã chọn không, để báo khi phải dùng giọng khác. */
export function hasExactVoice(lang: string): boolean {
  const voice = findVoice(lang);
  return voice?.lang.toLowerCase().replace('_', '-') === lang.toLowerCase();
}

export function speak(text: string, lang = 'en-GB', options: { slow?: boolean } = {}) {
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
