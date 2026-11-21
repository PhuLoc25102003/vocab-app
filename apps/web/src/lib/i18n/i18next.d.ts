import type { resources } from './config';

/** Khoá dịch có kiểu theo bộ chuỗi `vi`: gõ sai khoá là lỗi TypeScript. */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: (typeof resources)['vi'];
  }
}
