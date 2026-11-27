'use client';

import { Languages } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  loadLocale,
  LOCALES,
  type Locale,
  toLocale,
} from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

/** Ghi cookie, đổi ngay ở client rồi làm mới server component (ADR 0003). */
function useSwitchLocale() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const current = toLocale(i18n.language);
  const change = (next: Locale) => {
    if (next === current) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    document.documentElement.lang = next;
    // Bộ chuỗi tiếng Anh tải khi cần; lỗi mạng thì vẫn đổi, chuỗi thiếu dùng tiếng Việt.
    void loadLocale(i18n, next)
      .catch(() => undefined)
      .then(() => i18n.changeLanguage(next));
    router.refresh();
  };
  return { current, change };
}

/** Nút gọn ở header: bấm để sang ngôn ngữ còn lại. */
export function LanguageToggle() {
  const { t } = useTranslation('common');
  const { current, change } = useSwitchLocale();
  return (
    <Button
      variant="ghost"
      className="min-w-11 shrink-0 gap-1 px-2 text-small font-semibold"
      onClick={() => change(current === 'vi' ? 'en' : 'vi')}
    >
      <Languages aria-hidden className="size-4" />
      {t('language.short')}
      <span className="sr-only">, {t('language.switchTo')}</span>
    </Button>
  );
}

/** Nhóm nút chọn ngôn ngữ trong trang Tài khoản. */
export function LanguageSettings() {
  const { t } = useTranslation('common');
  const { current, change } = useSwitchLocale();
  return (
    <section
      aria-labelledby="language-title"
      className="flex w-full flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:p-5 shadow-2xs"
    >
      <div className="flex flex-col gap-1">
        <h2 id="language-title" className="text-h3">
          {t('language.label')}
        </h2>
        <p className="text-small text-text-muted">{t('language.description')}</p>
      </div>
      <div role="radiogroup" aria-labelledby="language-title" className="flex flex-wrap gap-2">
        {LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            role="radio"
            aria-checked={current === locale}
            lang={locale}
            onClick={() => change(locale)}
            className={cn(
              'min-h-11 rounded-full px-4 font-medium',
              current === locale ? 'glass-button-tint' : 'glass-button',
            )}
          >
            {t(`language.names.${locale}`)}
          </button>
        ))}
      </div>
    </section>
  );
}
