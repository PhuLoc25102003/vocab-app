import { createInstance, type i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from '@/locales/en/common.json';
import enErrors from '@/locales/en/errors.json';
import viCommon from '@/locales/vi/common.json';
import viErrors from '@/locales/vi/errors.json';

/** Hai ngôn ngữ giao diện, `vi` mặc định (ADR 0003). */
export const LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'vi';

/** Cookie lưu ngôn ngữ, đọc được ở cả server và client. */
export const LOCALE_COOKIE = 'vocab.locale';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Mỗi feature một namespace; thêm file JSON vào cả `vi` và `en` rồi khai báo ở đây. */
export const resources = {
  vi: { common: viCommon, errors: viErrors },
  en: { common: enCommon, errors: enErrors },
} as const;

export type Namespace = keyof (typeof resources)['vi'];
export const DEFAULT_NAMESPACE: Namespace = 'common';

/** Mã `Intl` cho ngày giờ và số. */
export const INTL_LOCALE: Record<Locale, string> = { vi: 'vi-VN', en: 'en-US' };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function toLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Instance i18next riêng: server tạo mỗi request một cái, client tạo một cái cho cả cây React.
 * Chuỗi import tĩnh nên khởi tạo xong ngay, không cần chờ.
 */
export function createI18n(locale: Locale): i18n {
  const instance = createInstance();
  void instance.use(initReactI18next).init({
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: LOCALES,
    resources,
    defaultNS: DEFAULT_NAMESPACE,
    ns: Object.keys(resources.vi),
    interpolation: { escapeValue: false },
    initAsync: false,
    returnNull: false,
  });
  return instance;
}
