import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioButton } from './audio-button';

class FakeUtterance {
  lang = '';
  constructor(readonly text: string) {}
}

const renderButton = () => render(<AudioButton text="apple" lang="en" label="Nghe apple" />);

describe('AudioButton', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(window, 'speechSynthesis');
  });

  it('đọc đúng nội dung và ngôn ngữ', async () => {
    const speak = vi.fn();
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { speak, cancel: vi.fn() },
    });
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    renderButton();

    await userEvent.click(screen.getByRole('button', { name: 'Nghe apple' }));

    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: 'apple', lang: 'en-GB' }));
  });

  it('ẩn khi trình duyệt không hỗ trợ âm thanh', () => {
    const originalAudio = window.Audio;
    // @ts-expect-error test unsupported environment
    delete window.Audio;
    try {
      renderButton();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    } finally {
      window.Audio = originalAudio;
    }
  });

  it('vẫn hiện nút nghe khi không có Web Speech nhưng có HTML5 Audio (như điện thoại Vivo/Oppo/Xiaomi)', () => {
    renderButton();
    expect(screen.getByRole('button', { name: 'Nghe apple' })).toBeInTheDocument();
  });
});
