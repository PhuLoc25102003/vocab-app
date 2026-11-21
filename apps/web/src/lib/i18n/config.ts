import { createInstance, type i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from '@/locales/en/common.json';
import enMarketing from '@/locales/en/marketing.json';
import enAdmin from '@/locales/en/admin.json';
import enAccount from '@/locales/en/account.json';
import enAuth from '@/locales/en/auth.json';
import enClasses from '@/locales/en/classes.json';
import enStudy from '@/locales/en/study.json';
import enSets from '@/locales/en/sets.json';
import enErrors from '@/locales/en/errors.json';
import enValidation from '@/locales/en/validation.json';
import viCommon from '@/locales/vi/common.json';
import viMarketing from '@/locales/vi/marketing.json';
import viAdmin from '@/locales/vi/admin.json';
import viAccount from '@/locales/vi/account.json';
import viAuth from '@/locales/vi/auth.json';
import viClasses from '@/locales/vi/classes.json';
import viStudy from '@/locales/vi/study.json';
import viSets from '@/locales/vi/sets.json';
import viErrors from '@/locales/vi/errors.json';
import viValidation from '@/locales/vi/validation.json';

/** Hai ngôn ngữ giao diện, `vi` mặc định (ADR 0003). */
export const LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'vi';

/** Cookie lưu ngôn ngữ, đọc được ở cả server và client. */
export const LOCALE_COOKIE = 'vocab.locale';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Mỗi feature một namespace; thêm file JSON vào cả `vi` và `en` rồi khai báo ở đây. */
export const resources = {
  vi: {
    common: viCommon,
    marketing: viMarketing,
    admin: viAdmin,
    account: viAccount,
    auth: viAuth,
    classes: viClasses,
    study: viStudy,
    sets: viSets,
    errors: viErrors,
    validation: viValidation,
  },
  en: {
    common: enCommon,
    marketing: enMarketing,
    admin: enAdmin,
    account: enAccount,
    auth: enAuth,
    classes: enClasses,
    study: enStudy,
    sets: enSets,
    errors: enErrors,
    validation: enValidation,
  },
} as const;

export type Namespace = keyof (typeof resources)['vi'];
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
    react: {
      useSuspense: false,
    },
  });
  return instance;
}
