const STORAGE_KEY = 'vocab.sound';

/** Hai nốt đi lên (Mi, La), ngắn và nhỏ để không làm phiền khi học trong lớp. */
const CORRECT_NOTES = [
  { frequency: 659.25, start: 0, duration: 0.12 },
  { frequency: 880, start: 0.09, duration: 0.18 },
] as const;
const PEAK_GAIN = 0.08;
const ATTACK_SECONDS = 0.01;

type AudioContextConstructor = new () => AudioContext;

let context: AudioContext | null = null;

function audioContextClass(): AudioContextConstructor | null {
  if (typeof window === 'undefined') return null;
  const legacy = (window as Window & { webkitAudioContext?: AudioContextConstructor })
    .webkitAudioContext;
  return window.AudioContext ?? legacy ?? null;
}

export function isSoundSupported(): boolean {
  return audioContextClass() !== null;
}

/** Âm thanh hiệu ứng mặc định bật; chỉ tắt khi người dùng đã tắt trên thiết bị này. */
export function loadSoundEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function saveSoundEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // Không lưu được thì chỉ áp dụng trong phiên này.
  }
}

/**
 * Phát âm báo trả lời đúng nếu người dùng chưa tắt. Trình duyệt chặn âm thanh trước lần bấm đầu
 * tiên, nhưng lúc này người học vừa bấm hoặc gõ nên luôn được phát. Lỗi âm thanh không làm hỏng
 * việc học.
 */
export function playCorrectSound(): void {
  const Context = audioContextClass();
  if (!Context || !loadSoundEnabled()) return;
  try {
    context ??= new Context();
    if (context.state === 'suspended') void context.resume();
    const now = context.currentTime;
    for (const { frequency, start, duration } of CORRECT_NOTES) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(PEAK_GAIN, now + start + ATTACK_SECONDS);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now + start);
      oscillator.stop(now + start + duration + 0.02);
    }
  } catch {
    // Thiết bị không phát được âm thanh: bỏ qua.
  }
}
