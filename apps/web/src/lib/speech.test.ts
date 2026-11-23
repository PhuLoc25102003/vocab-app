import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadSpeechSettings, saveSpeechSettings, speak } from './speech';

class FakeUtterance {
  lang = '';
  rate = 1;
  voice: { lang: string } | null = null;
  constructor(readonly text: string) {}
}

function installSynth(voices: { lang: string; name: string }[]) {
  const spoken: FakeUtterance[] = [];
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      cancel: vi.fn(),
      getVoices: () => voices,
      speak: (utterance: FakeUtterance) => spoken.push(utterance),
    },
  });
  return spoken;
}

describe('giọng đọc', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('lưu và đọc lựa chọn, dữ liệu hỏng thì về mặc định', () => {
    expect(loadSpeechSettings()).toEqual({ accent: 'en-GB', rate: 'normal' });
    saveSpeechSettings({ accent: 'en-US', rate: 'slow' });
    expect(loadSpeechSettings()).toEqual({ accent: 'en-US', rate: 'slow' });
    window.localStorage.setItem('vocab.speech', '{hỏng');
    expect(loadSpeechSettings()).toEqual({ accent: 'en-GB', rate: 'normal' });
  });

  it('đọc tiếng Anh theo giọng đã chọn, nghe chậm thì giảm tốc độ', () => {
    const spoken = installSynth([
      { lang: 'en-US', name: 'Mỹ' },
      { lang: 'en-GB', name: 'Anh' },
    ]);
    saveSpeechSettings({ accent: 'en-GB', rate: 'normal' });

    speak('apple', 'en');
    speak('apple', 'en', { slow: true });
    speak('quả táo', 'vi');

    expect(spoken.map(({ lang, rate }) => [lang, rate])).toEqual([
      ['en-GB', 1],
      ['en-GB', 0.7],
      ['vi', 1],
    ]);
    expect(spoken[0]?.voice).toMatchObject({ name: 'Anh' });
  });

  it('ưu tiên giọng Natural hoặc Google chất lượng cao hơn giọng mặc định máy', () => {
    installSynth([
      { lang: 'en-GB', name: 'Microsoft George Desktop' },
      { lang: 'en-GB', name: 'Microsoft Sonia Online (Natural) - English (United Kingdom)' },
    ]);
    saveSpeechSettings({ accent: 'en-GB', rate: 'normal' });

    speak('hello', 'en');
    expect(window.speechSynthesis.speak).toBeDefined();
  });

  it('tự động phát qua Audio fallback khi trình duyệt không có speechSynthesis (như Vivo/Oppo/Zalo webview)', () => {
    Reflect.deleteProperty(window, 'speechSynthesis');
    const playMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal(
      'Audio',
      class {
        play = playMock;
        pause = vi.fn();
        currentTime = 0;
        playbackRate = 1;
        constructor(public src: string) {}
      },
    );

    speak('hello', 'en-GB');
    expect(playMock).toHaveBeenCalled();
  });
});
