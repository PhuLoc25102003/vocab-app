export type Accent = 'en-US' | 'en-GB';
export type SpeechRate = 'normal' | 'slow';

export interface SpeechSettings {
  accent: Accent;
  rate: SpeechRate;
}

export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = { accent: 'en-GB', rate: 'normal' };
const RATES: Record<SpeechRate, number> = { normal: 1, slow: 0.7 };
const STORAGE_KEY = 'vocab.speech';

export function isNativeSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' && 'speechSynthesis' in window && Boolean(window.speechSynthesis)
  );
}

export function isSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' && ('speechSynthesis' in window || typeof Audio !== 'undefined')
  );
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
  if (!isNativeSpeechSupported()) return undefined;
  const voices = window.speechSynthesis?.getVoices?.() ?? [];
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

let currentAudio: HTMLAudioElement | null = null;

export function stopSpeaking(): void {
  if (typeof window === 'undefined') return;
  if (isNativeSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Bỏ qua lỗi trình duyệt cũ
    }
  }
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // Bỏ qua lỗi audio
    }
    currentAudio = null;
  }
}

/** Phát âm qua HTML5 Audio fallback cho các thiết bị không có Web Speech API (như Vivo Browser, Zalo webview,...) */
export function playAudioFallback(
  text: string,
  targetLang: string,
  options: { slow?: boolean } = {},
): void {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    const cleanText = text.trim();
    if (!cleanText) return;
    const encoded = encodeURIComponent(cleanText);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${targetLang}&q=${encoded}`;
    const audio = new Audio(url);
    if (options.slow) {
      audio.playbackRate = 0.75;
    }
    currentAudio = audio;
    audio.play().catch((err) => {
      console.warn('Audio fallback playback failed:', err);
    });
  } catch (err) {
    console.warn('Audio fallback error:', err);
  }
}

export function speak(text: string, lang = 'en-GB', options: { slow?: boolean } = {}) {
  if (!isSpeechSupported()) {
    return;
  }
  stopSpeaking();

  const settings = loadSpeechSettings();
  const target = targetLang(lang, settings.accent);

  if (isNativeSpeechSupported()) {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = target;
      const voice = findVoice(target);
      if (voice) {
        utterance.voice = voice;
      }
      utterance.rate = options.slow ? RATES.slow : RATES[settings.rate];

      let started = false;
      utterance.onstart = () => {
        started = true;
      };

      utterance.onerror = () => {
        if (!started) {
          playAudioFallback(text, target, options);
        }
      };

      // Fix lỗi Chrome / WebView trên Android bị treo trạng thái paused
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);

      // Watchdog: Nếu sau 1.2s trình duyệt không thể phát âm (do không có TTS engine cài trên máy) -> tự động chuyển sang Audio fallback
      setTimeout(() => {
        if (!started && (!window.speechSynthesis.speaking || window.speechSynthesis.paused)) {
          try {
            window.speechSynthesis.cancel();
          } catch {
            // ignore
          }
          playAudioFallback(text, target, options);
        }
      }, 1200);

      return;
    } catch {
      // Chuyển sang fallback nếu lỗi khởi tạo utterance
    }
  }

  // Dự phòng khi trình duyệt không hỗ trợ Web Speech API (như Vivo Browser, Zalo webview, etc.)
  playAudioFallback(text, target, options);
}
