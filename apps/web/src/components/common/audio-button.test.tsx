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

    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: 'apple', lang: 'en' }));
  });

  it('ẩn khi trình duyệt không hỗ trợ', () => {
    renderButton();

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
