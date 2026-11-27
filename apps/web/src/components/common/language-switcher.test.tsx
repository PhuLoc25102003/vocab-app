import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/lib/i18n/messages-en';
import { I18nProvider } from '@/lib/i18n/provider';
import { LanguageSettings, LanguageToggle } from './language-switcher';

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

describe('đổi ngôn ngữ', () => {
  beforeEach(() => {
    router.refresh.mockReset();
    document.cookie = 'vocab.locale=; max-age=0; path=/';
  });

  it('nút ở header đổi sang tiếng Anh: ghi cookie, đổi lang, làm mới server', async () => {
    render(
      <I18nProvider locale="vi">
        <LanguageToggle />
      </I18nProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'EN, đổi sang tiếng Anh' }));
    expect(document.cookie).toContain('vocab.locale=en');
    expect(document.documentElement.lang).toBe('en');
    expect(router.refresh).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole('button', { name: 'VI, switch to Vietnamese' }),
    ).toHaveTextContent('VI');
  });

  it('Tài khoản: chọn ngôn ngữ, chọn lại ngôn ngữ đang dùng thì không làm gì', async () => {
    render(
      <I18nProvider locale="en" en={en}>
        <LanguageSettings />
      </I18nProvider>,
    );

    const group = screen.getByRole('radiogroup', { name: 'Language' });
    expect(group).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'English' }));
    expect(router.refresh).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('radio', { name: 'Vietnamese' }));
    expect(router.refresh).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('radio', { name: 'Tiếng Việt' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
