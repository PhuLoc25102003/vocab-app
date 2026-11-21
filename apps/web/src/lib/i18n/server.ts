import { cookies } from 'next/headers';
import { cache } from 'react';
import { createI18n, LOCALE_COOKIE, type Locale, type Namespace, toLocale } from './config';

/** Ngôn ngữ của request hiện tại, theo cookie `vocab.locale`, không có thì `vi`. */
export async function getLocale(): Promise<Locale> {
  return toLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}

const instanceFor = cache((locale: Locale) => createI18n(locale));

/** Hàm dịch cho server component: `const t = await getT('common')`. */
export async function getT<N extends Namespace>(namespace: N) {
  return instanceFor(await getLocale()).getFixedT(null, namespace);
}
