import { describe, expect, it } from 'vitest';
import { createI18n, LOCALES, resources, toLocale } from './config';

type Tree = { [key: string]: string | Tree };

function keysOf(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : keysOf(value, `${prefix}${key}.`),
  );
}

describe('i18n', () => {
  it('hai ngôn ngữ có cùng namespace và cùng bộ khoá, không chuỗi rỗng', () => {
    expect(Object.keys(resources.en).sort()).toEqual(Object.keys(resources.vi).sort());
    for (const namespace of Object.keys(resources.vi) as (keyof typeof resources.vi)[]) {
      const vi = keysOf(resources.vi[namespace]).sort();
      expect(keysOf(resources.en[namespace]).sort(), namespace).toEqual(vi);
      for (const locale of LOCALES) {
        const strings = JSON.stringify(resources[locale][namespace]);
        expect(strings, `${locale}/${namespace}`).not.toContain('""');
      }
    }
  });

  it('cookie lạ thì về tiếng Việt, mỗi instance dịch theo ngôn ngữ của nó', () => {
    expect(toLocale('en')).toBe('en');
    expect(toLocale('fr')).toBe('vi');
    expect(toLocale(undefined)).toBe('vi');
    expect(createI18n('en').t('language.label')).toBe('Language');
    expect(createI18n('vi').t('language.label')).toBe('Ngôn ngữ');
  });

  it('khoá dịch có kiểu', () => {
    const { t } = createI18n('vi');
    // @ts-expect-error Khoá không có trong bộ chuỗi `vi` phải là lỗi TypeScript.
    expect(t('language.notAKey')).toBe('language.notAKey');
  });
});
