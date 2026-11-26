import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_STORAGE_KEY, themeInitScript } from '@/lib/theme';
import { ThemeToggle } from './theme-toggle';

function mockSystemTheme(prefersDark: boolean) {
  vi.mocked(window.matchMedia).mockReturnValue({
    matches: prefersDark,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList);
}

function runInitScript() {
  new Function(themeInitScript)();
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    mockSystemTheme(false);
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('bật, tắt giao diện tối và lưu lựa chọn', async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Giao diện tối' });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(button);
    expect(document.documentElement).toHaveClass('dark');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    await userEvent.click(button);
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('cập nhật khi tab khác đổi giao diện', () => {
    render(<ThemeToggle />);

    act(() => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY }));
    });

    expect(screen.getByRole('button', { name: 'Giao diện tối' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

describe('themeInitScript', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it.each([
    ['lựa chọn tối', 'dark', false, true],
    ['lựa chọn sáng thắng cài đặt hệ thống', 'light', true, false],
    ['không có lựa chọn, hệ thống tối', null, true, true],
    ['không có lựa chọn, hệ thống sáng vẫn mặc định tối', null, false, true],
  ])('%s', (_name, stored, prefersDark, expected) => {
    if (stored) {
      localStorage.setItem(THEME_STORAGE_KEY, stored);
    }
    mockSystemTheme(prefersDark);

    runInitScript();

    expect(document.documentElement.classList.contains('dark')).toBe(expected);
  });
});
