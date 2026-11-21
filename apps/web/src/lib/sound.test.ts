import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('sound', () => {
  const start = vi.fn();
  const AudioContextMock = vi.fn(function (this: Record<string, unknown>) {
    const param = () => ({
      value: 0,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    });
    const node = () => {
      const created = { gain: param(), frequency: param(), type: '', start, stop: vi.fn() };
      return { ...created, connect: (target: unknown) => target };
    };
    Object.assign(this, {
      state: 'running',
      currentTime: 0,
      destination: {},
      createOscillator: node,
      createGain: node,
    });
  });

  beforeEach(() => {
    vi.resetModules();
    start.mockClear();
    window.localStorage.clear();
    vi.stubGlobal('AudioContext', AudioContextMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mặc định bật và phát hai nốt', async () => {
    const { loadSoundEnabled, playCorrectSound } = await import('./sound');
    expect(loadSoundEnabled()).toBe(true);
    playCorrectSound();
    expect(start).toHaveBeenCalledTimes(2);
  });

  it('không phát khi người dùng đã tắt', async () => {
    const { loadSoundEnabled, playCorrectSound, saveSoundEnabled } = await import('./sound');
    saveSoundEnabled(false);
    expect(loadSoundEnabled()).toBe(false);
    playCorrectSound();
    expect(start).not.toHaveBeenCalled();
  });

  it('bỏ qua khi trình duyệt không có Web Audio', async () => {
    vi.stubGlobal('AudioContext', undefined);
    const { isSoundSupported, playCorrectSound } = await import('./sound');
    expect(isSoundSupported()).toBe(false);
    expect(() => playCorrectSound()).not.toThrow();
  });
});
