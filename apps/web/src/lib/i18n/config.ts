import { createInstance, type i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { vi, type Messages } from './messages-vi';

/** Hai ngôn ngữ giao diện, `vi` mặc định (ADR 0003). */
export const LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'vi';

/** Cookie lưu ngôn ngữ, đọc được ở cả server và client. */
export const LOCALE_COOKIE = 'vocab.locale';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Mỗi feature một namespace; thêm file JSON vào cả `vi` và `en` rồi khai báo ở `messages-*.ts`. */
export type Namespace = keyof Messages;
export type Bundles = Partial<Record<Locale, Messages>>;
export const DEFAULT_NAMESPACE: Namespace = 'common';

/** Mã `Intl` cho ngày giờ và số. */
export const INTL_LOCALE: Record<Locale, string> = { vi: 'vi-VN', en: 'en-US' };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function toLocale(value: unknown): Locale {
  if (typeof value !== 'string') return DEFAULT_LOCALE;
  const norm = value.trim().toLowerCase().slice(0, 2);
  return norm === 'en' ? 'en' : 'vi';
}

/**
 * Instance i18next riêng: server tạo mỗi request một cái, client tạo một cái cho cả cây React.
 * Chuỗi có sẵn nên khởi tạo xong ngay, không cần chờ. Mặc định chỉ có tiếng Việt; server truyền
 * `resources` đủ hai ngôn ngữ, client nhận thêm tiếng Anh khi trang mở bằng tiếng Anh.
 */
export function createI18n(locale: Locale, bundles: Bundles = { vi }): i18n {
  const instance = createInstance();
  void instance.use(initReactI18next).init({
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: LOCALES,
    resources: bundles,
    defaultNS: DEFAULT_NAMESPACE,
    ns: Object.keys(vi),
    interpolation: { escapeValue: false },
    initAsync: false,
    returnNull: false,
    react: {
      useSuspense: false,
    },
  });
  return instance;
}

/** Tải bộ chuỗi tiếng Anh vào instance nếu chưa có, gọi trước khi `changeLanguage('en')`. */
export async function loadLocale(instance: i18n, locale: Locale): Promise<void> {
  if (instance.hasResourceBundle(locale, DEFAULT_NAMESPACE)) return;
  const { en } = await import('./messages-en');
  for (const [namespace, messages] of Object.entries(en)) {
    instance.addResourceBundle(locale, namespace, messages, true, true);
  }
}
